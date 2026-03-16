import { useState, useRef, useCallback } from 'react';
import { usePluginContext } from '../context';
import { pickZipFile, extractAndVerify, buildExtractDir } from '../zip/extract';
import { validateWebflowExport } from '../zip/discover';
import type { ZipStep } from '../zip/types';

type Mode = 'pixel-perfect' | 'best-site';

export function MainView() {
  const [mode, setMode] = useState<Mode>('pixel-perfect');
  const ctx = usePluginContext();
  const shellRef = useRef(ctx?.shell ?? null);
  shellRef.current = ctx?.shell ?? null;

  const [step, setStep] = useState<ZipStep>({ kind: 'idle' });

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

    // Step 4: Done
    setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount });
  }, [ctx]);

  const handleRetry = useCallback(() => {
    setStep({ kind: 'idle' });
  }, []);

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

        {step.kind === 'done' && (
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
