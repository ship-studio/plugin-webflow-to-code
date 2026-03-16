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
  max-height: 80vh;
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

`;
