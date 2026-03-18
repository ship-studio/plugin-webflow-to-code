import { useState, useRef, useCallback, useEffect } from 'react';
import { usePluginContext } from '../context';
import { pickZipFile, extractAndVerify, buildExtractDir } from '../zip/extract';
import { validateWebflowExport } from '../zip/discover';
import { copyAssets } from '../assets/copy';
import { buildSiteAnalysis } from '../analysis/analyze';
import { generateBrief } from '../brief/generate';
import { saveBrief, copyToClipboard } from '../brief/io';
import { generateMigrationPlan } from '../plan/generate';
import { saveMigrationPlan } from '../plan/io';
import { loadMigrationPlan } from '../plan/read';
import { MigrationProgress } from '../components/MigrationProgress';
import type { BriefResult, PreserveOption } from '../brief/types';
import { PRESERVE_OPTIONS, DEFAULT_PRESERVE } from '../brief/types';
import type { ZipStep } from '../zip/types';

type Mode = 'pixel-perfect' | 'best-site';

function PreserveCheckbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        gap: '8px',
        padding: '4px 0',
        cursor: 'pointer',
        fontSize: '11px',
        color: 'var(--text-primary)',
      }}
    >
      <div
        style={{
          width: '14px',
          height: '14px',
          minWidth: '14px',
          borderRadius: '3px',
          border: checked ? 'none' : '1.5px solid var(--text-muted)',
          background: checked ? '#0d99ff' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}

export function MainView() {
  const [mode, setMode] = useState<Mode>('pixel-perfect');
  const [preserve, setPreserve] = useState<Set<PreserveOption>>(new Set(DEFAULT_PRESERVE));
  const [customNotes, setCustomNotes] = useState('');
  const ctx = usePluginContext();
  const shellRef = useRef(ctx?.shell ?? null);
  shellRef.current = ctx?.shell ?? null;

  const [step, setStep] = useState<ZipStep>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);

  // On mount, check if a migration plan already exists from a previous session
  const projectPath = ctx?.project?.path ?? '';
  const shell = ctx?.shell ?? null;
  useEffect(() => {
    if (!shell || !projectPath) return;
    loadMigrationPlan(shell, projectPath).then((plan) => {
      if (plan !== null) setHasExistingPlan(true);
    });
  }, [shell, projectPath]);

  const togglePreserve = useCallback((key: PreserveOption) => {
    setPreserve((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSelectZip = useCallback(async () => {
    const shell = shellRef.current;
    const projectPath = ctx?.project?.path;
    if (!shell || !projectPath) return;

    // Step 1: Pick file
    setStep({ kind: 'picking' });
    let zipPath: string | null;
    try {
      zipPath = await pickZipFile(shell);
    } catch (err: any) {
      setStep({ kind: 'error', message: err?.message || 'File picker failed' });
      return;
    }
    if (!zipPath) {
      setStep({ kind: 'idle' }); // user cancelled
      return;
    }

    // Step 2: Extract
    const extractDir = buildExtractDir(projectPath, zipPath);
    let manifest;
    try {
      manifest = await extractAndVerify(shell, zipPath, extractDir, (label) => {
        const countMatch = label.match(/\((\d+) files\)/);
        const fileCount = countMatch ? parseInt(countMatch[1], 10) : 0;
        setStep({ kind: 'extracting', fileCount });
      });
    } catch (err: any) {
      setStep({ kind: 'error', message: err?.message || 'Extraction failed' });
      return;
    }

    // Step 3: Validate
    setStep({ kind: 'validating' });
    try {
      await validateWebflowExport(shell, extractDir, manifest.entries);
    } catch (err: any) {
      setStep({ kind: 'error', message: err?.message || 'Validation failed' });
      return;
    }

    // Step 4: Copy assets
    setStep({ kind: 'copying', label: 'Copying assets...' });
    let assetManifest;
    try {
      assetManifest = await copyAssets(shell, extractDir, projectPath, manifest.entries, (label) => {
        setStep({ kind: 'copying', label });
      });
    } catch (err: any) {
      setStep({ kind: 'error', message: err?.message || 'Asset copy failed' });
      return;
    }

    // Step 5: Analyze pages
    setStep({ kind: 'analyzing', pageCount: 0 });
    let siteAnalysis;
    try {
      siteAnalysis = await buildSiteAnalysis(shell, manifest.entries, extractDir, (label) => {
        const countMatch = label.match(/(\d+)\/(\d+)/);
        const current = countMatch ? parseInt(countMatch[1], 10) : 0;
        setStep({ kind: 'analyzing', pageCount: current });
      });
    } catch (err: any) {
      setStep({ kind: 'error', message: err?.message || 'Analysis failed' });
      return;
    }

    // Step 6: Generate brief
    setStep({ kind: 'generating' });
    let briefResult: BriefResult;
    try {
      briefResult = generateBrief({
        mode,
        siteAnalysis,
        assetManifest,
        projectPath,
        preserve: mode === 'best-site' ? preserve : undefined,
        customNotes: mode === 'best-site' ? customNotes : undefined,
      });
      await saveBrief(shell, projectPath, briefResult.markdown);
      const migrationPlan = generateMigrationPlan(siteAnalysis);
      await saveMigrationPlan(shell, projectPath, migrationPlan);
    } catch (err: any) {
      setStep({ kind: 'error', message: err?.message || 'Brief generation failed' });
      return;
    }

    // Step 7: Done with all results
    setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount, assetManifest, siteAnalysis, briefResult });
  }, [ctx, mode, preserve, customNotes]);

  const handleRetry = useCallback(() => {
    setStep({ kind: 'idle' });
    setCopied(false);
  }, []);

  const handleCopyBrief = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell || step.kind !== 'done' || !step.briefResult) return;
    try {
      await copyToClipboard(shell, step.briefResult.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail clipboard — non-critical
    }
  }, [step]);

  const showModeSelector = (step.kind === 'idle' && !hasExistingPlan) || step.kind === 'picking' || step.kind === 'error';
  const pageCount = step.kind === 'done' ? (step.siteAnalysis?.contentPageCount ?? 0) : 0;
  const isMultiSession = pageCount > 3;

  return (
    <div>
      {showModeSelector && (
        <>
          <span className="wf2c-label">Conversion Mode</span>
          <div className="wf2c-mode-group">
            <div
              className={`wf2c-mode-card${mode === 'pixel-perfect' ? ' selected' : ''}`}
              onClick={() => setMode('pixel-perfect')}
            >
              <div className="wf2c-mode-card-name">Pixel Perfect</div>
              <div className="wf2c-mode-card-desc">
                Exact dimensions, fixed units, preserve Webflow layout
              </div>
            </div>
            <div
              className={`wf2c-mode-card${mode === 'best-site' ? ' selected' : ''}`}
              onClick={() => setMode('best-site')}
            >
              <div className="wf2c-mode-card-name">Best Site</div>
              <div className="wf2c-mode-card-desc">
                Modern code — you choose what to keep from the original
              </div>
            </div>
          </div>

          {mode === 'best-site' && (
            <div className="wf2c-preserve-section">
              <span className="wf2c-label" style={{ marginBottom: '4px' }}>Preserve from original</span>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
                {PRESERVE_OPTIONS.map((opt) => (
                  <PreserveCheckbox
                    key={opt.key}
                    label={opt.label}
                    checked={preserve.has(opt.key)}
                    onToggle={() => togglePreserve(opt.key)}
                  />
                ))}
              </div>
              <span className="wf2c-label" style={{ marginTop: '8px', marginBottom: '4px' }}>Additional instructions (optional)</span>
              <textarea
                className="wf2c-custom-notes"
                placeholder='e.g. "Keep the gradient hero but make the nav sticky"'
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '16px' }}>
        {step.kind === 'idle' && !hasExistingPlan && (
          <button className="btn-primary" onClick={handleSelectZip} style={{ width: '100%' }}>
            Select Webflow Export (.zip)
          </button>
        )}

        {step.kind === 'idle' && hasExistingPlan && (
          <>
            <MigrationProgress
              shell={shellRef.current!}
              projectPath={ctx?.project?.path ?? ''}
            />
            <button
              className="wf2c-btn-ghost"
              onClick={() => { setHasExistingPlan(false); }}
            >
              New Migration
            </button>
          </>
        )}

        {step.kind === 'picking' && (
          <button className="btn-primary" disabled style={{ width: '100%' }}>
            Opening file picker...
          </button>
        )}

        {step.kind === 'extracting' && (
          <div className="wf2c-progress">
            Extracting zip... ({step.fileCount} files)
          </div>
        )}

        {step.kind === 'validating' && (
          <div className="wf2c-progress">Validating export...</div>
        )}

        {step.kind === 'copying' && (
          <div className="wf2c-progress">{step.label}</div>
        )}

        {step.kind === 'analyzing' && (
          <div className="wf2c-progress">Analyzing pages... ({step.pageCount})</div>
        )}

        {step.kind === 'generating' && (
          <div className="wf2c-progress">Generating brief...</div>
        )}

        {step.kind === 'done' && step.briefResult && (
          <>
            <div className="wf2c-results">
              <div className="wf2c-results-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="8" fill="#4caf50" />
                  <path d="M4.5 8.5L7 11L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Brief ready
              </div>
              <div className="wf2c-results-stats">
                {step.siteAnalysis?.contentPageCount} pages &middot;{' '}
                {(step.assetManifest?.images.length ?? 0) + (step.assetManifest?.videos.length ?? 0) + (step.assetManifest?.fonts.length ?? 0)} assets &middot;{' '}
                ~{Math.round(step.briefResult.estimatedTokens / 1000)}K tokens
              </div>
              {isMultiSession && (
                <div className="wf2c-results-tip">
                  This site has {pageCount} pages — it will take multiple prompts to build. A migration plan file tracks progress across sessions. The brief tells the AI how to use it.
                </div>
              )}
              <div className="wf2c-results-output">
                <span className="wf2c-results-output-label">Output</span>
                <div className="wf2c-results-path">.shipstudio/assets/brief.md</div>
                <div className="wf2c-results-path">.shipstudio/migration-plan.json</div>
              </div>
              <button
                className="btn-primary"
                onClick={handleCopyBrief}
                style={{ width: '100%' }}
              >
                {copied ? 'Copied!' : 'Copy Brief to Clipboard'}
              </button>
              <button
                className="wf2c-btn-ghost"
                onClick={handleRetry}
              >
                Start Over
              </button>
            </div>
            <MigrationProgress
              shell={shellRef.current!}
              projectPath={ctx?.project?.path ?? ''}
            />
          </>
        )}

        {step.kind === 'done' && !step.briefResult && (
          <div className="wf2c-progress wf2c-progress-done">
            Done — extracted {step.fileCount} files
          </div>
        )}

        {step.kind === 'error' && (
          <>
            <div className="wf2c-error">{step.message}</div>
            <button
              className="btn-primary"
              onClick={handleRetry}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
