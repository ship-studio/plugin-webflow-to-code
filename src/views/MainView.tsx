import { useState, useRef, useCallback } from 'react';
import { usePluginContext } from '../context';
import { pickZipFile, extractAndVerify, buildExtractDir } from '../zip/extract';
import { validateWebflowExport } from '../zip/discover';
import { copyAssets } from '../assets/copy';
import { buildSiteAnalysis } from '../analysis/analyze';
import { generateBrief } from '../brief/generate';
import { saveBrief, copyToClipboard } from '../brief/io';
import type { BriefResult } from '../brief/types';
import type { ZipStep } from '../zip/types';

type Mode = 'pixel-perfect' | 'best-site';

export function MainView() {
  const [mode, setMode] = useState<Mode>('pixel-perfect');
  const ctx = usePluginContext();
  const shellRef = useRef(ctx?.shell ?? null);
  shellRef.current = ctx?.shell ?? null;

  const [step, setStep] = useState<ZipStep>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);

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
      briefResult = generateBrief({ mode, siteAnalysis, assetManifest, projectPath });
      await saveBrief(shell, projectPath, briefResult.markdown);
    } catch (err: any) {
      setStep({ kind: 'error', message: err?.message || 'Brief generation failed' });
      return;
    }

    // Step 7: Done with all results
    setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount, assetManifest, siteAnalysis, briefResult });
  }, [ctx, mode]);

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

  const showModeSelector = step.kind === 'idle' || step.kind === 'picking' || step.kind === 'error';

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
                Semantic HTML, responsive patterns, modern conventions
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: '16px' }}>
        {step.kind === 'idle' && (
          <button className="btn-primary" onClick={handleSelectZip} style={{ width: '100%' }}>
            Select Webflow Export (.zip)
          </button>
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
          <div className="wf2c-results">
            <div className="wf2c-results-header">Brief ready</div>
            <button
              className="btn-primary"
              onClick={handleCopyBrief}
              style={{ width: '100%' }}
            >
              {copied ? 'Copied!' : 'Copy Brief to Clipboard'}
            </button>
            <div className="wf2c-results-stats">
              {step.siteAnalysis?.contentPageCount} pages &middot;{' '}
              {(step.assetManifest?.images.length ?? 0) + (step.assetManifest?.videos.length ?? 0) + (step.assetManifest?.fonts.length ?? 0)} assets &middot;{' '}
              ~{Math.round(step.briefResult.estimatedTokens / 1000)}K tokens
            </div>
            <div className="wf2c-results-path">.shipstudio/assets/brief.md</div>
            <button
              className="btn-primary"
              onClick={handleRetry}
              style={{ width: '100%', marginTop: '8px', opacity: 0.7 }}
            >
              Start Over
            </button>
          </div>
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
