import { useState } from 'react';

type Mode = 'pixel-perfect' | 'best-site';

export function MainView() {
  const [mode, setMode] = useState<Mode>('pixel-perfect');

  return (
    <div>
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
      <div style={{ marginTop: '16px' }}>
        <button className="wf2c-btn-primary" disabled>
          Select Webflow Export (.zip)
        </button>
      </div>
    </div>
  );
}
