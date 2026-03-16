import { useEffect, useCallback } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { STYLE_ID, PLUGIN_CSS } from '../styles';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

/**
 * Reusable modal shell with overlay, header, body, escape-to-close.
 * Injects plugin CSS on mount and cleans up on unmount.
 */
export function Modal({ open, onClose, title, headerRight, children }: ModalProps) {
  // Inject CSS on mount, remove on unmount
  useEffect(() => {
    if (!open) return;

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = PLUGIN_CSS;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };
  }, [open]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Close on overlay click (not modal body)
  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div className="wf2c-overlay" onClick={handleOverlayClick}>
      <div className="wf2c-modal">
        <div className="wf2c-modal-header">
          <svg
            width="16"
            height="16"
            viewBox="0 0 1080 674"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1080 0L735.385 673.684H411.695L555.915 394.481H549.444C430.463 548.934 252.941 650.61 -0.000976562 673.684V398.344C-0.000976562 398.344 161.812 388.787 256.938 288.776H-0.000976562V0.0053214H288.77V237.515L295.252 237.489L413.254 0.0053214H631.644V236.009L638.125 235.999L760.555 0H1080Z"
            />
          </svg>
          <span className="wf2c-modal-title">{title}</span>
          {headerRight && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              {headerRight}
            </div>
          )}
        </div>
        <div className="wf2c-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
