export const STYLE_ID = 'webflow-to-code-styles';

export const PLUGIN_CSS = `
.wf2c-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.wf2c-modal {
  width: 480px;
  max-height: 60vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.wf2c-modal-header {
  display: flex;
  flex-direction: row;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  align-items: center;
}

.wf2c-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.wf2c-modal-body::-webkit-scrollbar {
  display: none;
}

.wf2c-modal-title {
  font-size: 15px;
  font-weight: 600;
}

.wf2c-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: block;
}

.wf2c-mode-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wf2c-mode-card {
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.wf2c-mode-card:hover {
  border-color: var(--text-muted);
}

.wf2c-mode-card.selected {
  border-color: var(--accent, #0d99ff);
}

.wf2c-mode-card-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.wf2c-mode-card-desc {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.3;
}

.wf2c-progress {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wf2c-progress::before {
  content: '';
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent, #0d99ff);
  border-radius: 50%;
  animation: wf2c-spin 0.6s linear infinite;
}

.wf2c-progress-done {
  color: var(--text-primary);
  font-weight: 500;
}

.wf2c-progress-done::before {
  content: none;
}

.wf2c-error {
  font-size: 13px;
  color: #e53935;
  padding: 12px;
  background: rgba(229, 57, 53, 0.08);
  border-radius: 6px;
  line-height: 1.5;
}

@keyframes wf2c-spin {
  to { transform: rotate(360deg); }
}

.wf2c-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 0;
}

.wf2c-results-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.wf2c-results-stats {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.wf2c-results-output {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wf2c-results-output-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wf2c-results-path {
  font-size: 11px;
  font-family: monospace;
  color: var(--text-muted);
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.wf2c-btn-ghost {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  text-align: center;
  width: 100%;
  transition: color 0.15s ease;
}

.wf2c-btn-ghost:hover {
  color: var(--text-secondary);
}

.wf2c-preserve-section {
  margin-top: 12px;
}

.wf2c-checklist {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wf2c-check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-primary);
  padding: 3px 0;
  cursor: pointer;
  user-select: none;
}

.wf2c-checkbox {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1.5px solid var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.wf2c-checkbox.checked {
  background: var(--accent, #0d99ff);
  border-color: var(--accent, #0d99ff);
}

.wf2c-custom-notes {
  width: 100%;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 36px;
  box-sizing: border-box;
}

.wf2c-custom-notes::placeholder {
  color: var(--text-muted);
}

.wf2c-custom-notes:focus {
  outline: none;
  border-color: var(--accent, #0d99ff);
}

.wf2c-results-tip {
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  border-left: 2px solid var(--accent, #0d99ff);
  padding: 6px 8px;
  line-height: 1.4;
  border-radius: 0 4px 4px 0;
}

`;
