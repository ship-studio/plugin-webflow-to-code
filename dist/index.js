import { jsx, jsxs, Fragment } from "data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
import { useEffect, useCallback, useState } from "data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
const STYLE_ID = "webflow-to-code-styles";
const PLUGIN_CSS = `
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

.wf2c-btn-primary {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--accent, #0d99ff);
  color: white;
  border: none;
  font-size: 13px;
  cursor: pointer;
}

.wf2c-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
function Modal({ open, onClose, title, headerRight, children }) {
  useEffect(() => {
    if (!open) return;
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = PLUGIN_CSS;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { className: "wf2c-overlay", onClick: handleOverlayClick, children: /* @__PURE__ */ jsxs("div", { className: "wf2c-modal", children: [
    /* @__PURE__ */ jsxs("div", { className: "wf2c-modal-header", children: [
      /* @__PURE__ */ jsx(
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 1080 674",
          fill: "currentColor",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              fillRule: "evenodd",
              clipRule: "evenodd",
              d: "M1080 0L735.385 673.684H411.695L555.915 394.481H549.444C430.463 548.934 252.941 650.61 -0.000976562 673.684V398.344C-0.000976562 398.344 161.812 388.787 256.938 288.776H-0.000976562V0.0053214H288.77V237.515L295.252 237.489L413.254 0.0053214H631.644V236.009L638.125 235.999L760.555 0H1080Z"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "wf2c-modal-title", children: title }),
      headerRight && /* @__PURE__ */ jsx("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center" }, children: headerRight })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "wf2c-modal-body", children })
  ] }) });
}
function MainView() {
  const [mode, setMode] = useState("pixel-perfect");
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("span", { className: "wf2c-label", children: "Conversion Mode" }),
    /* @__PURE__ */ jsxs("div", { className: "wf2c-mode-group", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `wf2c-mode-card${mode === "pixel-perfect" ? " selected" : ""}`,
          onClick: () => setMode("pixel-perfect"),
          children: [
            /* @__PURE__ */ jsx("div", { className: "wf2c-mode-card-name", children: "Pixel Perfect" }),
            /* @__PURE__ */ jsx("div", { className: "wf2c-mode-card-desc", children: "Exact dimensions, fixed units, preserve Webflow layout" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `wf2c-mode-card${mode === "best-site" ? " selected" : ""}`,
          onClick: () => setMode("best-site"),
          children: [
            /* @__PURE__ */ jsx("div", { className: "wf2c-mode-card-name", children: "Best Site" }),
            /* @__PURE__ */ jsx("div", { className: "wf2c-mode-card-desc", children: "Semantic HTML, responsive patterns, modern conventions" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: "16px" }, children: /* @__PURE__ */ jsx("button", { className: "wf2c-btn-primary", disabled: true, children: "Select Webflow Export (.zip)" }) })
  ] });
}
function WebflowIcon() {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 1080 674",
      fill: "currentColor",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          fillRule: "evenodd",
          clipRule: "evenodd",
          d: "M1080 0L735.385 673.684H411.695L555.915 394.481H549.444C430.463 548.934 252.941 650.61 -0.000976562 673.684V398.344C-0.000976562 398.344 161.812 388.787 256.938 288.776H-0.000976562V0.0053214H288.77V237.515L295.252 237.489L413.254 0.0053214H631.644V236.009L638.125 235.999L760.555 0H1080Z"
        }
      )
    }
  );
}
function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setModalOpen(true),
        title: "Webflow to Code",
        className: "toolbar-icon-btn",
        children: /* @__PURE__ */ jsx(WebflowIcon, {})
      }
    ),
    /* @__PURE__ */ jsx(
      Modal,
      {
        open: modalOpen,
        onClose: () => setModalOpen(false),
        title: "Webflow to Code",
        children: /* @__PURE__ */ jsx(MainView, {})
      }
    )
  ] });
}
const name = "Webflow to Code";
const slots = {
  toolbar: ToolbarButton
};
function onActivate() {
  console.log("[webflow-to-code] Plugin activated");
}
function onDeactivate() {
  console.log("[webflow-to-code] Plugin deactivated");
}
export {
  name,
  onActivate,
  onDeactivate,
  slots
};
