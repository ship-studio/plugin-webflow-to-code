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
function stripVariantSuffix(filename) {
  return filename.replace(/(-p-\d+(?:x\d+)?(?:q\d+)?)(\.[^.]+)$/, "$2");
}
function inferImagePurpose(filename) {
  const lower = filename.toLowerCase();
  if (lower === "favicon.png" || lower === "webclip.png") return "favicon";
  if (lower.includes("logo")) return "logo";
  if (lower.includes("placeholder")) return "placeholder";
  if (lower.endsWith(".svg")) return "icon-or-graphic";
  if (lower.endsWith(".gif")) return "animation";
  return "image";
}
function inferImageType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".svg")) return "svg";
  if (lower.endsWith(".gif")) return "animation";
  return "image";
}
function toProjectRelative(assetsDir, subpath) {
  const idx = assetsDir.indexOf(".shipstudio");
  if (idx === -1) return `${assetsDir}/${subpath}`;
  return `${assetsDir.slice(idx)}/${subpath}`;
}
function groupResponsiveVariants(imageEntries, assetsDir) {
  const svgEntries = [];
  const rasterEntries = [];
  for (const entry of imageEntries) {
    const filename = entry.split("/").pop();
    if (filename.toLowerCase().endsWith(".svg")) {
      svgEntries.push({
        filename,
        path: toProjectRelative(assetsDir, `images/${filename}`),
        type: "svg",
        purpose: inferImagePurpose(filename),
        referencingPages: []
      });
    } else {
      rasterEntries.push(entry);
    }
  }
  const groups = /* @__PURE__ */ new Map();
  for (const entry of rasterEntries) {
    const filename = entry.split("/").pop();
    const baseName = stripVariantSuffix(filename);
    const key = baseName.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { canonical: null, variants: [] });
    }
    const group = groups.get(key);
    if (filename === baseName) {
      group.canonical = filename;
    } else {
      group.variants.push(filename);
    }
  }
  const rasterResults = [];
  for (const group of groups.values()) {
    const filename = group.canonical ?? (group.variants.length === 1 ? group.variants[0] : group.variants[0]);
    let variants;
    if (group.canonical && group.variants.length > 0) {
      variants = group.variants;
    } else if (!group.canonical && group.variants.length > 1) {
      variants = group.variants.slice(1);
    }
    rasterResults.push({
      filename,
      path: toProjectRelative(assetsDir, `images/${filename}`),
      type: inferImageType(filename),
      purpose: inferImagePurpose(filename),
      variants: variants && variants.length > 0 ? variants : void 0,
      referencingPages: []
    });
  }
  return [...rasterResults, ...svgEntries];
}
function buildVideoGroups(videoEntries, assetsDir) {
  const sources = videoEntries.filter((e) => {
    const f = e.split("/").pop();
    return !f.includes("-transcode") && !f.includes("-poster-");
  });
  return sources.map((srcEntry) => {
    var _a;
    const filename = srcEntry.split("/").pop();
    const baseName = filename.replace(/\.[^.]+$/, "");
    const transcodes = videoEntries.filter((e) => e.split("/").pop().startsWith(baseName + "-transcode")).map((e) => e.split("/").pop());
    const poster = (_a = videoEntries.find((e) => e.split("/").pop().startsWith(baseName + "-poster-"))) == null ? void 0 : _a.split("/").pop();
    return {
      filename,
      path: toProjectRelative(assetsDir, `videos/${filename}`),
      type: "video",
      purpose: "video",
      transcodes: transcodes.length > 0 ? transcodes : void 0,
      poster,
      referencingPages: []
    };
  });
}
function buildManifest(entries, assetsDir, projectPath) {
  const imageEntries = entries.filter(
    (e) => e.startsWith("images/") && !e.endsWith("/")
  );
  const videoEntries = entries.filter(
    (e) => e.startsWith("videos/") && !e.endsWith("/")
  );
  const fontEntries = entries.filter(
    (e) => e.startsWith("fonts/") && !e.endsWith("/")
  );
  const cssEntries = entries.filter(
    (e) => e.startsWith("css/") && !e.endsWith("/")
  );
  const jsEntries = entries.filter(
    (e) => e.startsWith("js/") && !e.endsWith("/")
  );
  const images = groupResponsiveVariants(imageEntries, assetsDir);
  const videos = buildVideoGroups(videoEntries, assetsDir);
  const fonts = fontEntries.map((e) => {
    const filename = e.split("/").pop();
    return {
      filename,
      path: toProjectRelative(assetsDir, `fonts/${filename}`),
      type: "font",
      purpose: "font",
      referencingPages: []
    };
  });
  const cssFiles = cssEntries.map(
    (e) => toProjectRelative(assetsDir, e)
  );
  const totalCopied = imageEntries.length + videoEntries.length + fontEntries.length + cssEntries.length + jsEntries.length;
  return {
    images,
    videos,
    fonts,
    cssFiles,
    totalCopied
  };
}
async function copyDirIfExists(shell, srcDir, destDir, label, onProgress, timeout) {
  const check = await shell.exec("bash", [
    "-c",
    `test -d '${srcDir}' && echo exists || echo absent`
  ]);
  if (check.stdout.trim() === "absent") return;
  onProgress == null ? void 0 : onProgress(label);
  const mkdirResult = await shell.exec("mkdir", ["-p", destDir]);
  if (mkdirResult.exit_code !== 0) {
    throw new Error(`Failed to create directory ${destDir}: ${mkdirResult.stderr.trim()}`);
  }
  const cpResult = await shell.exec(
    "bash",
    ["-c", `cp -r '${srcDir}/.' '${destDir}/'`],
    { timeout: timeout ?? 12e4 }
  );
  if (cpResult.exit_code !== 0) {
    throw new Error(`Failed to copy ${srcDir} to ${destDir}: ${cpResult.stderr.trim()}`);
  }
}
async function copyAssets(shell, extractDir, projectPath, entries, onProgress) {
  const assetsDir = `${projectPath}/.shipstudio/assets`;
  const mkdirResult = await shell.exec("mkdir", ["-p", assetsDir]);
  if (mkdirResult.exit_code !== 0) {
    throw new Error(`Failed to create assets directory: ${mkdirResult.stderr.trim()}`);
  }
  await copyDirIfExists(
    shell,
    `${extractDir}/images`,
    `${assetsDir}/images`,
    "Copying images...",
    onProgress
  );
  await copyDirIfExists(
    shell,
    `${extractDir}/videos`,
    `${assetsDir}/videos`,
    "Copying videos (may take a moment)...",
    onProgress,
    3e5
  );
  await copyDirIfExists(
    shell,
    `${extractDir}/fonts`,
    `${assetsDir}/fonts`,
    "Copying fonts...",
    onProgress
  );
  await copyDirIfExists(
    shell,
    `${extractDir}/css`,
    `${assetsDir}/css`,
    "Copying CSS...",
    onProgress
  );
  await copyDirIfExists(
    shell,
    `${extractDir}/js`,
    `${assetsDir}/js`,
    "Copying JS...",
    onProgress
  );
  return buildManifest(entries, assetsDir);
}
const WEBFLOW_COMPONENT_REGISTRY = {
  "w-nav": {
    label: "Navbar",
    migration: "Replace with semantic <nav> + mobile hamburger. w-nav JS handles collapse — rebuild with CSS/JS toggle."
  },
  "w-dropdown": {
    label: "Dropdown",
    migration: "Replace with <details>/<summary> or CSS :hover + focus-within pattern. Webflow JS drives open/close."
  },
  "w-slider": {
    label: "Slider",
    migration: "Replace with a carousel library (Embla, Swiper) or CSS scroll snap. w-slider JS is non-portable."
  },
  "w-tabs": {
    label: "Tab Switcher",
    migration: 'Replace with accessible tab pattern (ARIA role="tablist"). Webflow JS drives panel switching.'
  },
  "w-form": {
    label: "Form",
    migration: "Form HTML is usable; replace Webflow form handling backend. Use Resend, Formspree, or server actions."
  },
  "w-lightbox": {
    label: "Lightbox",
    migration: "Replace with <dialog> element or a lightbox library. Webflow JS drives open/close/media display."
  },
  "w-embed": {
    label: "HTML Embed",
    migration: "Custom HTML embed — review contents. May contain third-party scripts; preserve as-is or integrate natively."
  },
  "w-richtext": {
    label: "Rich Text",
    migration: "CMS-bound rich text area. Wrap in prose CSS (e.g., Tailwind @typography) for correct rendering."
  },
  "w-background-video": {
    label: "Background Video",
    migration: "Replace with <video autoplay muted loop playsinline>. Video URLs in data-video-urls attr point to Webflow CDN — re-host the local copies."
  },
  "w-dyn-list": {
    label: "CMS Collection List",
    migration: "CMS-driven list. Replace with static data array or API fetch. No data exported in zip."
  }
};
function detectComponents(doc) {
  const results = [];
  for (const [key, def] of Object.entries(WEBFLOW_COMPONENT_REGISTRY)) {
    const elements = doc.querySelectorAll(`.${key}`);
    if (elements.length > 0) {
      results.push({
        wClass: key,
        label: def.label,
        count: elements.length,
        migration: def.migration
      });
    }
  }
  return results;
}
function detectInteractions(doc) {
  return doc.querySelector(
    "[data-animation], [data-easing], [data-duration-in], [data-duration-out], [data-collapse]"
  ) !== null;
}
function discoverHtmlPages(entries) {
  return entries.filter(
    (e) => e.endsWith(".html") && !e.endsWith("/") && !e.startsWith("__MACOSX")
  );
}
function inferRoute(filename) {
  if (filename.startsWith("detail_")) {
    const base = filename.replace(/\.html$/, "").replace(/^detail_/, "");
    return `/${base}/[slug]`;
  }
  const stripped = filename.replace(/\.html$/, "");
  if (stripped === "index") return "/";
  return `/${stripped}`;
}
function detectCmsTemplate(filename, doc) {
  var _a;
  if (filename.startsWith("detail_")) return true;
  if (doc.querySelector(".w-dyn-bind-empty")) return true;
  const title = ((_a = doc.querySelector("title")) == null ? void 0 : _a.textContent) ?? "";
  if (title.startsWith("|")) return true;
  return false;
}
function inferSectionLabel(className) {
  const classes = className.split(/\s+/);
  for (const cls of classes) {
    const sectionMatch = cls.match(/^section_(\w+)/);
    if (sectionMatch) return sectionMatch[1];
    if (cls.startsWith("footer_")) return "footer";
    if (cls.startsWith("header_")) return "header";
  }
  return "section";
}
const UTILITY_PAGES = ["401.html", "404.html"];
function isUtilityPage(filename) {
  if (UTILITY_PAGES.includes(filename)) return true;
  if (filename.includes("style-guide")) return true;
  return false;
}
async function parsePage(shell, htmlPath, filename) {
  var _a;
  const { stdout } = await shell.exec("bash", ["-c", `base64 < '${htmlPath}'`]);
  const html = atob(stdout.trim());
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const title = ((_a = doc.querySelector("title")) == null ? void 0 : _a.textContent) ?? "";
  const wfPageId = doc.documentElement.getAttribute("data-wf-page") ?? "";
  const sectionEls = doc.querySelectorAll(
    'section[class*="section_"], header[class*="section_"], header[class*="header_"], div[class*="section_"], footer[class*="footer_"]'
  );
  const sections = [];
  sectionEls.forEach((el) => {
    sections.push({
      tag: el.tagName.toLowerCase(),
      className: el.className,
      label: inferSectionLabel(el.className)
    });
  });
  const navEl = doc.querySelector(".w-nav");
  const navWfId = (navEl == null ? void 0 : navEl.getAttribute("data-w-id")) ?? null;
  const navClassName = (navEl == null ? void 0 : navEl.className) ?? null;
  const footerEl = doc.querySelector("footer") ?? doc.querySelector('[class*="footer_"]');
  const footerWfId = (footerEl == null ? void 0 : footerEl.getAttribute("data-w-id")) ?? null;
  const footerClassName = (footerEl == null ? void 0 : footerEl.className) ?? null;
  return {
    filename,
    route: inferRoute(filename),
    title,
    wfPageId,
    isCmsTemplate: detectCmsTemplate(filename, doc),
    isUtilityPage: isUtilityPage(filename),
    sections,
    webflowComponents: detectComponents(doc),
    hasIx2Interactions: detectInteractions(doc),
    navWfId,
    footerWfId,
    navClassName,
    footerClassName
  };
}
function detectSharedLayout(pages) {
  const contentPages = pages.filter((p) => !p.isCmsTemplate);
  if (contentPages.length < 2) {
    return {
      hasSharedNav: false,
      navWfId: void 0,
      hasSharedFooter: false,
      footerWfId: void 0,
      confidence: "high"
    };
  }
  const threshold = Math.ceil(contentPages.length * 0.5);
  const navResult = detectSharedElement(
    contentPages,
    (p) => p.navWfId,
    (p) => p.navClassName,
    threshold
  );
  const footerResult = detectSharedElement(
    contentPages,
    (p) => p.footerWfId,
    (p) => p.footerClassName,
    threshold
  );
  let confidence = "high";
  if (navResult.found && navResult.confidence === "medium" || footerResult.found && footerResult.confidence === "medium") {
    confidence = "medium";
  }
  return {
    hasSharedNav: navResult.found,
    navWfId: navResult.id,
    hasSharedFooter: footerResult.found,
    footerWfId: footerResult.id,
    confidence
  };
}
function detectSharedElement(pages, getId, getClassName, threshold) {
  const idCounts = /* @__PURE__ */ new Map();
  for (const page of pages) {
    const id = getId(page);
    if (id !== null) {
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
  }
  for (const [id, count] of idCounts) {
    if (count >= threshold) {
      return { found: true, id, confidence: "high" };
    }
  }
  const classCounts = /* @__PURE__ */ new Map();
  for (const page of pages) {
    const cls = getClassName(page);
    if (cls !== null) {
      classCounts.set(cls, (classCounts.get(cls) ?? 0) + 1);
    }
  }
  for (const [, count] of classCounts) {
    if (count >= threshold) {
      return { found: true, id: void 0, confidence: "medium" };
    }
  }
  return { found: false, id: void 0, confidence: "high" };
}
async function buildSiteAnalysis(shell, entries, extractDir, onProgress) {
  const htmlFiles = discoverHtmlPages(entries);
  const pages = [];
  for (let i = 0; i < htmlFiles.length; i++) {
    const filename = htmlFiles[i];
    onProgress == null ? void 0 : onProgress(`Analyzing page ${i + 1}/${htmlFiles.length}...`);
    const htmlPath = extractDir + "/" + filename;
    const page = await parsePage(shell, htmlPath, filename);
    pages.push(page);
  }
  const sharedLayout = detectSharedLayout(pages);
  const contentPageCount = pages.filter((p) => !p.isCmsTemplate).length;
  const cmsTemplateCount = pages.filter((p) => p.isCmsTemplate).length;
  const componentSet = /* @__PURE__ */ new Set();
  for (const page of pages) {
    for (const comp of page.webflowComponents) {
      componentSet.add(comp.wClass);
    }
  }
  return {
    pages,
    sharedLayout,
    contentPageCount,
    cmsTemplateCount,
    allWebflowComponents: [...componentSet].sort()
  };
}
const PRESERVE_OPTIONS = [
  { key: "brand-colors", label: "Brand colors & typography" },
  { key: "visual-hierarchy", label: "Visual hierarchy & spacing" },
  { key: "exact-layouts", label: "Exact layouts (grid/flex)" },
  { key: "animations", label: "Animations & interactions" },
  { key: "image-treatment", label: "Image treatment & sizing" }
];
const DEFAULT_PRESERVE = /* @__PURE__ */ new Set([
  "brand-colors",
  "visual-hierarchy",
  "image-treatment"
]);
function estimateTokens(markdown) {
  return Math.ceil(markdown.length / 4);
}
function escapeTableCell(value) {
  return value.replace(/\|/g, "\\|");
}
function deriveSiteName(cssFiles) {
  if (cssFiles.length >= 3) {
    const filename = cssFiles[2].split("/").pop() ?? "";
    const name2 = filename.replace(/\.css$/, "").replace(/-/g, " ");
    if (name2) {
      return name2.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }
  return "Webflow Export";
}
function buildMetadataSection(input) {
  const siteName = deriveSiteName(input.assetManifest.cssFiles);
  const date = input.date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const modeLabel = input.mode === "pixel-perfect" ? "Pixel Perfect" : "Best Site";
  const { contentPageCount, cmsTemplateCount } = input.siteAnalysis;
  const pagesStr = cmsTemplateCount > 0 ? `${contentPageCount} content pages, ${cmsTemplateCount} CMS templates` : `${contentPageCount} content pages`;
  estimateTokens("");
  const lines = [
    "# Webflow Migration Brief",
    "",
    `**Site:** ${siteName}`,
    `**Extracted:** ${date}`,
    `**Mode:** ${modeLabel}`,
    `**Pages:** ${pagesStr}`,
    `**Assets:** ${input.assetManifest.totalCopied} files copied to .shipstudio/assets/`
  ];
  return lines.join("\n");
}
function buildPreserveModernizeLists(preserve) {
  const preserveList = [];
  const modernizeList = [];
  for (const opt of PRESERVE_OPTIONS) {
    if (preserve.has(opt.key)) {
      preserveList.push(opt.label);
    } else {
      modernizeList.push(opt.label);
    }
  }
  return { preserveList, modernizeList };
}
function buildPreserveGuidance(preserve) {
  const lines = [];
  if (preserve.has("brand-colors")) {
    lines.push("- **Brand colors & typography:** Extract exact hex values, font families, sizes, and weights from the CSS files. Use these values verbatim in your implementation -- do not approximate or substitute.");
  }
  if (preserve.has("visual-hierarchy")) {
    lines.push("- **Visual hierarchy & spacing:** Maintain the original section ordering, relative element sizing, and whitespace rhythm. Spacing values (margins, padding, gaps) should match the CSS reference.");
  }
  if (preserve.has("exact-layouts")) {
    lines.push("- **Exact layouts:** Preserve the original CSS grid/flexbox structure. Replicate column counts, row patterns, and alignment. Use the same layout approach (grid vs flex) as the original.");
  }
  if (preserve.has("animations")) {
    lines.push("- **Animations & interactions:** Recreate hover states, transitions, scroll-triggered effects, and any IX2 interactions from the original. Match timing, easing, and trigger behavior.");
  }
  if (preserve.has("image-treatment")) {
    lines.push("- **Image treatment & sizing:** Keep original image aspect ratios, cropping, and responsive behavior. Use srcset with the provided variants where available.");
  }
  return lines.join("\n");
}
function buildModernizeGuidance(preserve) {
  const lines = [];
  if (!preserve.has("brand-colors")) {
    lines.push("- **Colors & typography:** Reference the CSS files for the general palette, but feel free to refine or systematize values (e.g., create design tokens or a Tailwind theme).");
  }
  if (!preserve.has("visual-hierarchy")) {
    lines.push("- **Visual hierarchy & spacing:** Use the original as a reference but improve spacing with a consistent scale (e.g., 4px/8px grid or rem-based spacing).");
  }
  if (!preserve.has("exact-layouts")) {
    lines.push("- **Layouts:** Reimagine using modern CSS grid and flexbox with relative units (rem, %, clamp). Prioritize responsiveness over exact replication.");
  }
  if (!preserve.has("animations")) {
    lines.push("- **Animations & interactions:** Implement tasteful, performant alternatives using CSS transitions and IntersectionObserver. Simplify where the original was overly complex.");
  }
  if (!preserve.has("image-treatment")) {
    lines.push("- **Images:** Use the largest available variant as src. Implement your own responsive image strategy optimized for your stack.");
  }
  return lines.join("\n");
}
function buildInstructionsSection(mode, preserve, customNotes) {
  if (mode === "pixel-perfect") {
    return `## How to Use This Brief

**Goal:** Reproduce the Webflow site with maximum visual fidelity. The output should be indistinguishable from the original when viewed in a browser.

**Before building:** Read the full Pages section for the page you are migrating. Study the section structure and Webflow components list. Review the CSS Reference section -- the original styles are in these files.

**During building:**
- Preserve all Webflow class names exactly as they appear. Do not rename \`.w-nav\` to \`nav\`, \`.w-button\` to \`button\`, or any other class.
- Copy normalize.css, webflow.css, and the site CSS file (in that order) into your project and import them. These contain all the layout and visual styles.
- Use the exact pixel values and fixed units from the original HTML structure.
- Every Webflow component (\`.w-nav\`, \`.w-slider\`, \`.w-tabs\`, etc.) must be replaced with a native implementation -- see the migration note in each component's entry. Do NOT use webflow.js.
- Build shared nav and footer as components (see Shared Layout section) and reuse them across all pages.

**After building:** Compare your output against the original Webflow export visually. Spacing, color, and typography should match the CSS file values.`;
  }
  const p = preserve ?? /* @__PURE__ */ new Set();
  const { preserveList, modernizeList } = buildPreserveModernizeLists(p);
  let preserveSection = "";
  if (preserveList.length > 0) {
    preserveSection = `

**Preserve from the original** (${preserveList.join(", ")}):
${buildPreserveGuidance(p)}`;
  }
  let modernizeSection = "";
  if (modernizeList.length > 0) {
    modernizeSection = `

**Modernize** (${modernizeList.join(", ")}):
${buildModernizeGuidance(p)}`;
  }
  let customSection = "";
  if (customNotes && customNotes.trim()) {
    customSection = `

**Additional instructions from the user:**
> ${customNotes.trim().replace(/\n/g, "\n> ")}`;
  }
  return `## How to Use This Brief

**Goal:** Rebuild the site using modern, semantic, maintainable code while preserving specific design elements from the original.

**Before building:** Read the Site Overview and Shared Layout sections first. Then work through pages one at a time, updating migration-plan.json as you go. Pay close attention to which aspects should be preserved vs. modernized.
${preserveSection}${modernizeSection}

**During building:**
- Use semantic HTML5 elements: \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<footer>\`.
- Replace Webflow utility classes with your project's preferred approach (Tailwind, CSS Modules, or plain CSS).
- Implement Webflow components as native equivalents: \`.w-nav\` -> \`<nav>\` with CSS + JS hamburger; \`.w-slider\` -> CSS scroll snap or a lightweight library; \`.w-tabs\` -> \`<details>\`/\`<summary>\` or custom JS tabs.
- Do NOT use webflow.js -- it is Webflow's proprietary runtime and will not work outside Webflow hosting.
- Reference the CSS files for design values. For preserved aspects, match them exactly. For modernized aspects, adapt to your implementation approach.
${customSection}
**After building:** Verify preserved aspects match the original exactly. For modernized aspects, verify the overall design intent is maintained while code quality is improved.`;
}
function buildOverviewSection(siteAnalysis) {
  const hasIx2 = siteAnalysis.pages.some((p) => p.hasIx2Interactions);
  const componentsList = siteAnalysis.allWebflowComponents.length > 0 ? siteAnalysis.allWebflowComponents.join(", ") : "None";
  const cmsLine = siteAnalysis.cmsTemplateCount > 0 ? `
**CMS templates:** ${siteAnalysis.cmsTemplateCount} (see CMS note in each template's page entry)` : "";
  return `## Site Overview

**Content pages:** ${siteAnalysis.contentPageCount}${cmsLine}
**Webflow components found:** ${componentsList}
**Has IX2 interactions:** ${hasIx2 ? "Yes" : "No"}

> webflow.js and the site JS file are Webflow runtime bundles. Do NOT attempt to use or port them. All interactive components listed above must be replaced with native implementations.`;
}
function buildSharedLayoutSection(sharedLayout, pages) {
  if (!sharedLayout.hasSharedNav && !sharedLayout.hasSharedFooter) {
    return "";
  }
  const lines = ["## Shared Layout", ""];
  if (sharedLayout.hasSharedNav) {
    const navPage = pages.find((p) => p.navClassName);
    const navClass = (navPage == null ? void 0 : navPage.navClassName) ?? "w-nav";
    lines.push(
      `**Navigation:** The nav component (class: \`.${navClass}\`) appears on all content pages. Build it once as a shared component and reuse it. This component uses \`.w-nav\` -- replace with a semantic \`<nav>\` and native hamburger JS for mobile.`,
      ""
    );
  }
  if (sharedLayout.hasSharedFooter) {
    const footerPage = pages.find((p) => p.footerClassName);
    const footerClass = (footerPage == null ? void 0 : footerPage.footerClassName) ?? "footer";
    lines.push(
      `**Footer:** The footer component (class: \`.${footerClass}\`) appears on all content pages. Build it once as a shared component.`,
      ""
    );
  }
  const confidenceDesc = sharedLayout.confidence === "high" ? "Detected via matching data-w-id attributes" : "Detected via matching class names -- verify visually";
  lines.push(`Confidence: ${confidenceDesc}`);
  return lines.join("\n");
}
function buildCSSReferenceSection(cssFiles, mode) {
  const rows = cssFiles.map((path) => {
    const filename = path.split("/").pop() ?? path;
    const purpose = filename === "normalize.css" ? "Cross-browser baseline reset" : filename === "webflow.css" ? "Webflow component base styles" : "Site-specific styles -- primary design reference";
    return `| \`${path}\` | ${purpose} |`;
  });
  const modeNote = mode === "pixel-perfect" ? "**Pixel Perfect mode:** Import all three files in the order shown above." : "**Best Site mode:** Use these files as a visual reference for colors, typography, and spacing values. Adapt to your implementation approach.";
  return `## CSS Reference

The following CSS files were copied to \`.shipstudio/assets/\`. Reference them directly rather than re-extracting values.

| File | Purpose |
|------|---------|
${rows.join("\n")}

${modeNote}`;
}
function buildPageSubsection(page, mode) {
  if (page.isCmsTemplate) {
    return `### ${escapeTableCell(page.title)} -- \`${page.route}\` *(CMS Template)*

**File:** \`${page.filename}\`
**Status:** CMS template -- no content exported. This is a dynamic route template; the actual content lives in Webflow's CMS database and is NOT included in the zip export.
**Action required:** Build the route structure and page layout. Source content from the Webflow CMS API, a headless CMS, or static placeholder content.`;
  }
  const lines = [];
  lines.push(`### ${escapeTableCell(page.title)} -- \`${page.route}\``);
  lines.push("");
  lines.push(`**File:** \`${page.filename}\``);
  if (page.sections.length > 0) {
    lines.push("**Sections:**");
    for (const s of page.sections) {
      lines.push(`- \`<${s.tag} class="${escapeTableCell(s.className)}">\` -- ${escapeTableCell(s.label)}`);
    }
  }
  if (page.webflowComponents.length > 0) {
    lines.push("");
    lines.push("**Webflow Components:**");
    lines.push("| Class | Component | Migration Note |");
    lines.push("|-------|-----------|----------------|");
    for (const c of page.webflowComponents) {
      lines.push(
        `| \`.${escapeTableCell(c.wClass)}\` | ${escapeTableCell(c.label)} | ${escapeTableCell(c.migration)} |`
      );
    }
  }
  if (page.hasIx2Interactions) {
    lines.push("");
    lines.push(
      "**Interactions:** This page uses Webflow IX2 animations (`data-ix` attributes). Replace with CSS transitions, IntersectionObserver scroll triggers, or equivalent native JS."
    );
  }
  return lines.join("\n");
}
function buildPagesSection(pages, mode) {
  const subsections = pages.map((p) => buildPageSubsection(p));
  return `## Pages

${subsections.join("\n\n")}`;
}
function buildAssetsSection(assetManifest, mode) {
  if (assetManifest.totalCopied === 0) {
    return "";
  }
  const lines = [
    "## Assets",
    "",
    "All files copied to `.shipstudio/assets/`."
  ];
  if (assetManifest.images.length > 0) {
    const srcsetNote = mode === "pixel-perfect" ? " Use srcset to serve responsive variants by suffix size (-p-500, -p-800, etc.)." : " Use the largest available variant as the src; implement your own responsive image strategy.";
    lines.push("");
    lines.push(`### Images (${assetManifest.images.length} unique images)`);
    lines.push("");
    lines.push(`${srcsetNote.trim()}`);
    lines.push("");
    lines.push("| File | Type | Purpose | Variants | Path |");
    lines.push("|------|------|---------|----------|------|");
    for (const img of assetManifest.images) {
      const variants = img.variants && img.variants.length > 0 ? img.variants.join(", ") : "--";
      lines.push(
        `| \`${escapeTableCell(img.filename)}\` | ${img.type} | ${escapeTableCell(img.purpose)} | ${variants} | \`${img.path}\` |`
      );
    }
  }
  if (assetManifest.videos.length > 0) {
    lines.push("");
    lines.push(`### Videos (${assetManifest.videos.length})`);
    lines.push("");
    lines.push("| File | Transcodes | Poster | Path |");
    lines.push("|------|-----------|--------|------|");
    for (const vid of assetManifest.videos) {
      const transcodes = vid.transcodes && vid.transcodes.length > 0 ? vid.transcodes.join(", ") : "--";
      const poster = vid.poster ?? "--";
      lines.push(
        `| \`${escapeTableCell(vid.filename)}\` | ${transcodes} | ${poster} | \`${vid.path}\` |`
      );
    }
  }
  if (assetManifest.fonts.length > 0) {
    lines.push("");
    lines.push(`### Fonts (${assetManifest.fonts.length})`);
    lines.push("");
    lines.push("| File | Path |");
    lines.push("|------|------|");
    for (const font of assetManifest.fonts) {
      lines.push(`| \`${escapeTableCell(font.filename)}\` | \`${font.path}\` |`);
    }
  }
  return lines.join("\n");
}
function buildMigrationPlanSection() {
  return `## Migration Plan

The file \`.shipstudio/migration-plan.json\` has been created for you. It contains all pages and sections from the site analysis with status \`"pending"\`.

**Before writing any code:**
1. Read \`.shipstudio/migration-plan.json\` to understand the full scope of work.
2. Do NOT recreate this file — it already exists. Do not overwrite it with a new structure.

**As you build:**
- Update each item's \`status\` from \`"pending"\` to \`"in-progress"\` when you start it.
- Update to \`"complete"\` when you finish and verify it.
- Use the optional \`notes\` field to record decisions: \`"responsive done, animations pending"\`.
- You may add new items (e.g., framework setup tasks) but keep the base structure intact.

**Example of the file format:**
\`\`\`json
{
  "version": "1.0",
  "generatedAt": "2026-03-18",
  "items": [
    { "name": "Shared Nav", "type": "shared", "status": "pending" },
    { "name": "Shared Footer", "type": "shared", "status": "pending" },
    {
      "name": "Home",
      "type": "page",
      "status": "in-progress",
      "notes": "Hero section done, working on features",
      "children": [
        { "name": "Hero", "type": "section", "status": "complete" },
        { "name": "Features", "type": "section", "status": "in-progress" },
        { "name": "Call to Action", "type": "section", "status": "pending" }
      ]
    }
  ]
}
\`\`\``;
}
function generateBrief(input) {
  const sections = [
    buildMetadataSection(input),
    buildMigrationPlanSection(),
    buildInstructionsSection(input.mode, input.preserve, input.customNotes),
    buildOverviewSection(input.siteAnalysis),
    buildSharedLayoutSection(input.siteAnalysis.sharedLayout, input.siteAnalysis.pages),
    buildCSSReferenceSection(input.assetManifest.cssFiles, input.mode),
    buildPagesSection(input.siteAnalysis.pages, input.mode),
    buildAssetsSection(input.assetManifest, input.mode)
  ].filter(Boolean);
  const markdown = sections.join("\n\n");
  const est = estimateTokens(markdown);
  const stats = {
    pageCount: input.siteAnalysis.pages.length,
    contentPageCount: input.siteAnalysis.contentPageCount,
    cmsTemplateCount: input.siteAnalysis.cmsTemplateCount,
    assetCount: input.assetManifest.images.length + input.assetManifest.videos.length + input.assetManifest.fonts.length,
    estimatedTokens: est
  };
  return {
    markdown,
    charCount: markdown.length,
    estimatedTokens: est,
    stats
  };
}
async function saveBrief(shell, projectPath, markdown) {
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec("bash", [
    "-c",
    `echo '${encoded}' | base64 -d > '${briefPath}'`
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save brief: ${result.stderr}`);
  }
}
async function copyToClipboard(shell, markdown) {
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec("bash", [
    "-c",
    `echo '${encoded}' | base64 -d | pbcopy`
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Clipboard copy failed: ${result.stderr}`);
  }
}
function generateMigrationPlan(siteAnalysis) {
  const items = [];
  if (siteAnalysis.sharedLayout.hasSharedNav) {
    items.push({ name: "Shared Nav", type: "shared", status: "pending" });
  }
  if (siteAnalysis.sharedLayout.hasSharedFooter) {
    items.push({ name: "Shared Footer", type: "shared", status: "pending" });
  }
  const contentPages = siteAnalysis.pages.filter((p) => !p.isCmsTemplate && !p.isUtilityPage);
  for (const page of contentPages) {
    const children = page.sections.map((s) => ({
      name: s.label,
      type: "section",
      status: "pending"
    }));
    items.push({
      name: page.title,
      type: "page",
      status: "pending",
      children: children.length > 0 ? children : void 0
    });
  }
  const cmsPages = siteAnalysis.pages.filter((p) => p.isCmsTemplate);
  for (const page of cmsPages) {
    items.push({
      name: page.title + " (CMS Template)",
      type: "page",
      status: "pending"
    });
  }
  return {
    version: "1.0",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    items
  };
}
async function saveMigrationPlan(shell, projectPath, plan) {
  const planDir = `${projectPath}/.shipstudio`;
  const planPath = `${planDir}/migration-plan.json`;
  const json = JSON.stringify(plan, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const result = await shell.exec("bash", [
    "-c",
    `mkdir -p '${planDir}' && echo '${encoded}' | base64 -d > '${planPath}'`
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save migration plan: ${result.stderr}`);
  }
}
async function loadMigrationPlan(shell, projectPath) {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const result = await shell.exec("bash", ["-c", `cat '${planPath}' | base64`]);
  if (result.exit_code !== 0) return null;
  try {
    const json = decodeURIComponent(escape(atob(result.stdout.trim())));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function computeProgress(plan) {
  let complete = 0;
  let total = 0;
  for (const item of plan.items) {
    const leaves = item.children && item.children.length > 0 ? item.children : [item];
    for (const leaf of leaves) {
      total++;
      if (leaf.status === "complete") complete++;
    }
  }
  return { complete, total };
}
function computePageProgress(item) {
  if (!item.children || item.children.length === 0) {
    return { complete: item.status === "complete" ? 1 : 0, total: 1 };
  }
  let complete = 0;
  for (const child of item.children) {
    if (child.status === "complete") complete++;
  }
  return { complete, total: item.children.length };
}
function buildResumePrompt(projectPath) {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  return `Read the migration plan at ${planPath} and the brief at ${briefPath}. Continue the migration from where you left off — update each item's status in the plan file as you complete it.`;
}
const STATUS_SYMBOL = {
  pending: "○",
  // ○
  "in-progress": "◆",
  // ◆
  complete: "✓"
  // ✓
};
const STATUS_COLOR = {
  pending: "var(--text-muted)",
  "in-progress": "var(--accent, #0d99ff)",
  complete: "#4caf50"
};
function ChildItem({ child }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: "6px",
        padding: "2px 0 2px 18px",
        fontSize: "11px"
      },
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              color: STATUS_COLOR[child.status],
              fontSize: "11px",
              minWidth: "14px",
              flexShrink: 0
            },
            children: STATUS_SYMBOL[child.status]
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { style: { color: "var(--text-primary)" }, children: child.name }),
          child.notes ? /* @__PURE__ */ jsx("div", { style: { color: "var(--text-muted)", fontSize: "10px", marginTop: "1px" }, children: child.notes }) : null
        ] })
      ]
    }
  );
}
function PlanRow({ item, isExpanded, onToggle }) {
  const hasChildren = item.children && item.children.length > 0;
  const progress = hasChildren ? computePageProgress(item) : null;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: hasChildren ? onToggle : void 0,
        style: {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 0",
          cursor: hasChildren ? "pointer" : "default",
          fontSize: "12px"
        },
        children: [
          hasChildren ? /* @__PURE__ */ jsx("span", { style: { color: "var(--text-muted)", fontSize: "10px", minWidth: "12px" }, children: isExpanded ? "▼" : "▶" }) : /* @__PURE__ */ jsx("span", { style: { color: STATUS_COLOR[item.status], fontSize: "11px", minWidth: "12px" }, children: STATUS_SYMBOL[item.status] }),
          /* @__PURE__ */ jsx("span", { style: { color: "var(--text-primary)", flex: 1 }, children: item.name }),
          progress ? /* @__PURE__ */ jsxs("span", { style: { color: "var(--text-muted)", fontSize: "11px" }, children: [
            progress.complete,
            "/",
            progress.total
          ] }) : null
        ]
      }
    ),
    isExpanded && item.children ? item.children.map((child, ci) => /* @__PURE__ */ jsx(ChildItem, { child }, ci)) : null
  ] });
}
function MigrationProgress({ shell, projectPath }) {
  const [plan, setPlan] = useState(null);
  const [pollError, setPollError] = useState(false);
  const [expanded, setExpanded] = useState(/* @__PURE__ */ new Set());
  const [resumeCopied, setResumeCopied] = useState(false);
  const hadPlan = useRef(false);
  useEffect(() => {
    async function poll() {
      const result = await loadMigrationPlan(shell, projectPath);
      if (result !== null) {
        setPlan(result);
        hadPlan.current = true;
        setPollError(false);
      } else if (hadPlan.current) {
        setPollError(true);
      }
    }
    poll();
    const id = setInterval(poll, 3e4);
    return () => clearInterval(id);
  }, [shell, projectPath]);
  const handleContinueMigration = useCallback(async () => {
    const promptText = buildResumePrompt(projectPath);
    await copyToClipboard(shell, promptText);
    setResumeCopied(true);
    setTimeout(() => setResumeCopied(false), 2e3);
  }, [shell, projectPath]);
  const toggleExpanded = useCallback((idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);
  const sectionLabel = /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "8px",
        marginTop: "16px"
      },
      children: "Migration Progress"
    }
  );
  if (pollError && plan === null) {
    return /* @__PURE__ */ jsxs("div", { children: [
      sectionLabel,
      /* @__PURE__ */ jsx("div", { style: { fontSize: "12px", color: "var(--text-muted)", padding: "8px 0" }, children: "Could not read migration plan" })
    ] });
  }
  if (plan === null) {
    return null;
  }
  const { complete, total } = computeProgress(plan);
  const pct = total > 0 ? Math.round(complete / total * 100) : 0;
  const sharedItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type === "shared");
  const pageItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type !== "shared");
  const orderedItems = [...sharedItems, ...pageItems];
  return /* @__PURE__ */ jsxs("div", { children: [
    sectionLabel,
    /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }, children: [
      complete,
      "/",
      total,
      " items (",
      pct,
      "%)"
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          height: "6px",
          borderRadius: "3px",
          background: "var(--bg-secondary)",
          overflow: "hidden",
          marginBottom: "12px"
        },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              height: "100%",
              width: `${pct}%`,
              background: "#4caf50",
              borderRadius: "3px",
              transition: "width 0.3s ease"
            }
          }
        )
      }
    ),
    /* @__PURE__ */ jsx("div", { children: orderedItems.map(({ item, idx }) => /* @__PURE__ */ jsx(
      PlanRow,
      {
        item,
        isExpanded: expanded.has(idx),
        onToggle: () => toggleExpanded(idx)
      },
      idx
    )) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "wf2c-btn-ghost",
        onClick: handleContinueMigration,
        style: { marginTop: "12px" },
        children: resumeCopied ? "Copied!" : "Continue Migration"
      }
    )
  ] });
}
function PreserveCheckbox({ label, checked, onToggle }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick: onToggle,
      style: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        padding: "4px 0",
        cursor: "pointer",
        fontSize: "11px",
        color: "var(--text-primary)"
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              width: "14px",
              height: "14px",
              minWidth: "14px",
              borderRadius: "3px",
              border: checked ? "none" : "1.5px solid var(--text-muted)",
              background: checked ? "#0d99ff" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            },
            children: checked && /* @__PURE__ */ jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M2 5.5L4 7.5L8 3", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
          }
        ),
        /* @__PURE__ */ jsx("span", { children: label })
      ]
    }
  );
}
function MainView() {
  var _a, _b, _c, _d, _e, _f, _g;
  const [mode, setMode] = useState("pixel-perfect");
  const [preserve, setPreserve] = useState(new Set(DEFAULT_PRESERVE));
  const [customNotes, setCustomNotes] = useState("");
  const ctx = usePluginContext();
  const shellRef = useRef((ctx == null ? void 0 : ctx.shell) ?? null);
  shellRef.current = (ctx == null ? void 0 : ctx.shell) ?? null;
  const [step, setStep] = useState({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  useEffect(() => {
    var _a2;
    const shell = shellRef.current;
    const projectPath = (_a2 = ctx == null ? void 0 : ctx.project) == null ? void 0 : _a2.path;
    if (!shell || !projectPath) return;
    loadMigrationPlan(shell, projectPath).then((plan) => {
      if (plan !== null) setHasExistingPlan(true);
    });
  }, [ctx]);
  const togglePreserve = useCallback((key) => {
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
    var _a2;
    const shell = shellRef.current;
    const projectPath = (_a2 = ctx == null ? void 0 : ctx.project) == null ? void 0 : _a2.path;
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
    setStep({ kind: "copying", label: "Copying assets..." });
    let assetManifest;
    try {
      assetManifest = await copyAssets(shell, extractDir, projectPath, manifest.entries, (label) => {
        setStep({ kind: "copying", label });
      });
    } catch (err) {
      setStep({ kind: "error", message: (err == null ? void 0 : err.message) || "Asset copy failed" });
      return;
    }
    setStep({ kind: "analyzing", pageCount: 0 });
    let siteAnalysis;
    try {
      siteAnalysis = await buildSiteAnalysis(shell, manifest.entries, extractDir, (label) => {
        const countMatch = label.match(/(\d+)\/(\d+)/);
        const current = countMatch ? parseInt(countMatch[1], 10) : 0;
        setStep({ kind: "analyzing", pageCount: current });
      });
    } catch (err) {
      setStep({ kind: "error", message: (err == null ? void 0 : err.message) || "Analysis failed" });
      return;
    }
    setStep({ kind: "generating" });
    let briefResult;
    try {
      briefResult = generateBrief({
        mode,
        siteAnalysis,
        assetManifest,
        projectPath,
        preserve: mode === "best-site" ? preserve : void 0,
        customNotes: mode === "best-site" ? customNotes : void 0
      });
      await saveBrief(shell, projectPath, briefResult.markdown);
      const migrationPlan = generateMigrationPlan(siteAnalysis);
      await saveMigrationPlan(shell, projectPath, migrationPlan);
    } catch (err) {
      setStep({ kind: "error", message: (err == null ? void 0 : err.message) || "Brief generation failed" });
      return;
    }
    setStep({ kind: "done", zipPath, extractDir, fileCount: manifest.fileCount, assetManifest, siteAnalysis, briefResult });
  }, [ctx, mode, preserve, customNotes]);
  const handleRetry = useCallback(() => {
    setStep({ kind: "idle" });
    setCopied(false);
  }, []);
  const handleCopyBrief = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell || step.kind !== "done" || !step.briefResult) return;
    try {
      await copyToClipboard(shell, step.briefResult.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch {
    }
  }, [step]);
  const showModeSelector = step.kind === "idle" && !hasExistingPlan || step.kind === "picking" || step.kind === "error";
  const pageCount = step.kind === "done" ? ((_a = step.siteAnalysis) == null ? void 0 : _a.contentPageCount) ?? 0 : 0;
  const isMultiSession = pageCount > 3;
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
              /* @__PURE__ */ jsx("div", { className: "wf2c-mode-card-desc", children: "Modern code — you choose what to keep from the original" })
            ]
          }
        )
      ] }),
      mode === "best-site" && /* @__PURE__ */ jsxs("div", { className: "wf2c-preserve-section", children: [
        /* @__PURE__ */ jsx("span", { className: "wf2c-label", style: { marginBottom: "4px" }, children: "Preserve from original" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "2px" }, children: PRESERVE_OPTIONS.map((opt) => /* @__PURE__ */ jsx(
          PreserveCheckbox,
          {
            label: opt.label,
            checked: preserve.has(opt.key),
            onToggle: () => togglePreserve(opt.key)
          },
          opt.key
        )) }),
        /* @__PURE__ */ jsx("span", { className: "wf2c-label", style: { marginTop: "8px", marginBottom: "4px" }, children: "Additional instructions (optional)" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "wf2c-custom-notes",
            placeholder: 'e.g. "Keep the gradient hero but make the nav sticky"',
            value: customNotes,
            onChange: (e) => setCustomNotes(e.target.value),
            rows: 2
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { marginTop: "16px" }, children: [
      step.kind === "idle" && !hasExistingPlan && /* @__PURE__ */ jsx("button", { className: "btn-primary", onClick: handleSelectZip, style: { width: "100%" }, children: "Select Webflow Export (.zip)" }),
      step.kind === "idle" && hasExistingPlan && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          MigrationProgress,
          {
            shell: shellRef.current,
            projectPath: ((_b = ctx == null ? void 0 : ctx.project) == null ? void 0 : _b.path) ?? ""
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn-primary",
            onClick: () => {
              setHasExistingPlan(false);
            },
            style: { width: "100%", marginTop: "12px" },
            children: "New Migration"
          }
        )
      ] }),
      step.kind === "picking" && /* @__PURE__ */ jsx("button", { className: "btn-primary", disabled: true, style: { width: "100%" }, children: "Opening file picker..." }),
      step.kind === "extracting" && /* @__PURE__ */ jsxs("div", { className: "wf2c-progress", children: [
        "Extracting zip... (",
        step.fileCount,
        " files)"
      ] }),
      step.kind === "validating" && /* @__PURE__ */ jsx("div", { className: "wf2c-progress", children: "Validating export..." }),
      step.kind === "copying" && /* @__PURE__ */ jsx("div", { className: "wf2c-progress", children: step.label }),
      step.kind === "analyzing" && /* @__PURE__ */ jsxs("div", { className: "wf2c-progress", children: [
        "Analyzing pages... (",
        step.pageCount,
        ")"
      ] }),
      step.kind === "generating" && /* @__PURE__ */ jsx("div", { className: "wf2c-progress", children: "Generating brief..." }),
      step.kind === "done" && step.briefResult && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "wf2c-results", children: [
          /* @__PURE__ */ jsxs("div", { className: "wf2c-results-header", children: [
            /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", style: { flexShrink: 0 }, children: [
              /* @__PURE__ */ jsx("circle", { cx: "8", cy: "8", r: "8", fill: "#4caf50" }),
              /* @__PURE__ */ jsx("path", { d: "M4.5 8.5L7 11L11.5 5.5", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
            ] }),
            "Brief ready"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "wf2c-results-stats", children: [
            (_c = step.siteAnalysis) == null ? void 0 : _c.contentPageCount,
            " pages ·",
            " ",
            (((_d = step.assetManifest) == null ? void 0 : _d.images.length) ?? 0) + (((_e = step.assetManifest) == null ? void 0 : _e.videos.length) ?? 0) + (((_f = step.assetManifest) == null ? void 0 : _f.fonts.length) ?? 0),
            " assets ·",
            " ",
            "~",
            Math.round(step.briefResult.estimatedTokens / 1e3),
            "K tokens"
          ] }),
          isMultiSession && /* @__PURE__ */ jsxs("div", { className: "wf2c-results-tip", children: [
            "This site has ",
            pageCount,
            " pages — it will take multiple prompts to build. A migration plan file tracks progress across sessions. The brief tells the AI how to use it."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "wf2c-results-output", children: [
            /* @__PURE__ */ jsx("span", { className: "wf2c-results-output-label", children: "Output" }),
            /* @__PURE__ */ jsx("div", { className: "wf2c-results-path", children: ".shipstudio/assets/brief.md" }),
            /* @__PURE__ */ jsx("div", { className: "wf2c-results-path", children: ".shipstudio/migration-plan.json" })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn-primary",
              onClick: handleCopyBrief,
              style: { width: "100%" },
              children: copied ? "Copied!" : "Copy Brief to Clipboard"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "wf2c-btn-ghost",
              onClick: handleRetry,
              children: "Start Over"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          MigrationProgress,
          {
            shell: shellRef.current,
            projectPath: ((_g = ctx == null ? void 0 : ctx.project) == null ? void 0 : _g.path) ?? ""
          }
        )
      ] }),
      step.kind === "done" && !step.briefResult && /* @__PURE__ */ jsxs("div", { className: "wf2c-progress wf2c-progress-done", children: [
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
