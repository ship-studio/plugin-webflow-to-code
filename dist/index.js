import { jsx, jsxs, Fragment } from "data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
import { useEffect, useCallback, useState, useRef } from "data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
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
const _w = window;
function usePluginContext() {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;
  if (CtxRef && (React == null ? void 0 : React.useContext)) {
    return React.useContext(CtxRef);
  }
  return null;
}
function parseUnzipManifest(stdout) {
  const lines = stdout.split("\n");
  const entries = [];
  for (const line of lines) {
    if (line.match(/^-{5,}/) || line.match(/Length\s+Date/) || line.trim() === "") continue;
    const match = line.match(/^\s*\d+\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/);
    if (match) entries.push(match[1].trim());
  }
  const fileEntries = entries.filter((e) => !e.endsWith("/"));
  const fileCount = fileEntries.length;
  return { fileCount, entries };
}
async function validateWebflowExport(shell, extractDir, entries) {
  const hasHtml = entries.some((e) => e.endsWith(".html") && !e.includes("/"));
  if (!hasHtml) {
    throw new Error("No HTML files found — is this a Webflow export?");
  }
  const hasCss = entries.some((e) => e.startsWith("css/"));
  if (!hasCss) {
    throw new Error("Missing CSS directory — is this a Webflow export?");
  }
  const grepResult = await shell.exec("bash", [
    "-c",
    `grep -c 'data-wf-site' '${extractDir}/index.html' 2>/dev/null || echo 0`
  ]);
  const wfSiteCount = parseInt(grepResult.stdout.trim(), 10);
  if (wfSiteCount === 0) {
    throw new Error(
      "No data-wf-site attribute found — this may not be a Webflow export"
    );
  }
}
async function pickZipFile(shell) {
  const result = await shell.exec("osascript", [
    "-e",
    'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})'
  ]);
  if (result.exit_code !== 0) {
    if (result.stderr.includes("-128")) {
      return null;
    }
    throw new Error(`File picker failed: ${result.stderr.trim()}`);
  }
  const path = result.stdout.trim();
  if (!path) {
    throw new Error("No path returned from file picker");
  }
  return path;
}
function buildExtractDir(projectPath, zipPath) {
  const zipFileName = zipPath.split("/").pop();
  const sanitizedName = zipFileName.replace(/\.zip$/i, "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60);
  return `${projectPath}/.shipstudio/tmp/${sanitizedName}`;
}
async function extractAndVerify(shell, zipPath, extractDir, onProgress) {
  const listResult = await shell.exec("unzip", ["-l", zipPath]);
  if (listResult.exit_code !== 0) {
    throw new Error(`Cannot read zip manifest: ${listResult.stderr.trim()}`);
  }
  const manifest = parseUnzipManifest(listResult.stdout);
  await shell.exec("mkdir", ["-p", extractDir]);
  onProgress == null ? void 0 : onProgress(`Extracting zip... (${manifest.fileCount} files)`);
  const extractResult = await shell.exec(
    "unzip",
    ["-o", zipPath, "-d", extractDir],
    { timeout: 3e5 }
  );
  if (extractResult.exit_code !== 0) {
    throw new Error(`Extraction failed: ${extractResult.stderr.trim()}`);
  }
  const countResult = await shell.exec("bash", [
    "-c",
    `find '${extractDir}' -type f | wc -l | tr -d ' '`
  ]);
  const actual = parseInt(countResult.stdout.trim(), 10);
  if (actual < manifest.fileCount - 2) {
    throw new Error(
      `Extraction incomplete: expected ~${manifest.fileCount} files, found ${actual}. The zip may be corrupted.`
    );
  }
  return manifest;
}
function MainView() {
  const [mode, setMode] = useState("pixel-perfect");
  const ctx = usePluginContext();
  const shellRef = useRef((ctx == null ? void 0 : ctx.shell) ?? null);
  shellRef.current = (ctx == null ? void 0 : ctx.shell) ?? null;
  const [step, setStep] = useState({ kind: "idle" });
  const handleSelectZip = useCallback(async () => {
    var _a;
    const shell = shellRef.current;
    const projectPath = (_a = ctx == null ? void 0 : ctx.project) == null ? void 0 : _a.path;
    if (!shell || !projectPath) return;
    setStep({ kind: "picking" });
    let zipPath;
    try {
      zipPath = await pickZipFile(shell);
    } catch (err) {
      setStep({ kind: "error", message: (err == null ? void 0 : err.message) || "File picker failed" });
      return;
    }
    if (!zipPath) {
      setStep({ kind: "idle" });
      return;
    }
    const extractDir = buildExtractDir(projectPath, zipPath);
    let manifest;
    try {
      manifest = await extractAndVerify(shell, zipPath, extractDir, (label) => {
        const countMatch = label.match(/\((\d+) files\)/);
        const fileCount = countMatch ? parseInt(countMatch[1], 10) : 0;
        setStep({ kind: "extracting", fileCount });
      });
    } catch (err) {
      setStep({ kind: "error", message: (err == null ? void 0 : err.message) || "Extraction failed" });
      return;
    }
    setStep({ kind: "validating" });
    try {
      await validateWebflowExport(shell, extractDir, manifest.entries);
    } catch (err) {
      setStep({ kind: "error", message: (err == null ? void 0 : err.message) || "Validation failed" });
      return;
    }
    setStep({ kind: "done", zipPath, extractDir, fileCount: manifest.fileCount });
  }, [ctx]);
  const handleRetry = useCallback(() => {
    setStep({ kind: "idle" });
  }, []);
  const showModeSelector = step.kind === "idle" || step.kind === "picking" || step.kind === "error";
  return /* @__PURE__ */ jsxs("div", { children: [
    showModeSelector && /* @__PURE__ */ jsxs(Fragment, { children: [
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
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { marginTop: "16px" }, children: [
      step.kind === "idle" && /* @__PURE__ */ jsx("button", { className: "btn-primary", onClick: handleSelectZip, style: { width: "100%" }, children: "Select Webflow Export (.zip)" }),
      step.kind === "picking" && /* @__PURE__ */ jsx("button", { className: "btn-primary", disabled: true, style: { width: "100%" }, children: "Opening file picker..." }),
      step.kind === "extracting" && /* @__PURE__ */ jsxs("div", { className: "wf2c-progress", children: [
        "Extracting zip... (",
        step.fileCount,
        " files)"
      ] }),
      step.kind === "validating" && /* @__PURE__ */ jsx("div", { className: "wf2c-progress", children: "Validating export..." }),
      step.kind === "done" && /* @__PURE__ */ jsxs("div", { className: "wf2c-progress wf2c-progress-done", children: [
        "Done — extracted ",
        step.fileCount,
        " files"
      ] }),
      step.kind === "error" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "wf2c-error", children: step.message }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn-primary",
            onClick: handleRetry,
            style: { width: "100%", marginTop: "8px" },
            children: "Try Again"
          }
        )
      ] })
    ] })
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
