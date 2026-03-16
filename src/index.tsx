import { useState } from 'react';
import { Modal } from './components/Modal';
import { MainView } from './views/MainView';

function WebflowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 1080 674"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1080 0L735.385 673.684H411.695L555.915 394.481H549.444C430.463 548.934 252.941 650.61 -0.000976562 673.684V398.344C-0.000976562 398.344 161.812 388.787 256.938 288.776H-0.000976562V0.0053214H288.77V237.515L295.252 237.489L413.254 0.0053214H631.644V236.009L638.125 235.999L760.555 0H1080Z"
      />
    </svg>
  );
}

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        title="Webflow to Code"
        className="toolbar-icon-btn"
      >
        <WebflowIcon />
      </button>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Webflow to Code"
      >
        <MainView />
      </Modal>
    </>
  );
}

export const name = 'Webflow to Code';

export const slots = {
  toolbar: ToolbarButton,
};

export function onActivate() {
  console.log('[webflow-to-code] Plugin activated');
}

export function onDeactivate() {
  console.log('[webflow-to-code] Plugin deactivated');
}
