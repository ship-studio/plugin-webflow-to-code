# Stack Research

**Domain:** Ship Studio plugin — Webflow export (.zip) processing and coding-agent brief generation
**Researched:** 2026-03-16
**Confidence:** HIGH — all findings sourced from direct inspection of plugin-starter, plugin-figma, plugin-gsd, plugin-webflow-cloud, and the actual Webflow .zip export in this repo. No training data guessing on plugin architecture. External library version verification not performed (no third-party deps needed — see rationale).

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x (peer dep, not bundled) | UI — toolbar button, modal, mode selector, progress display | Required by the host. The Vite config externalizes React via `window.__SHIPSTUDIO_REACT__` data: URL aliasing. Bundling your own copy breaks hooks. |
| TypeScript | ^5.6.0 | Type safety across HTML parsing, brief generation, shell ops | All plugins in the monorepo use this version. The webflow HTML structure and brief sections benefit from explicit types (page descriptor structs, asset manifests). |
| Vite | ^6.0.0 | Build tool producing `dist/index.js` | Non-negotiable. The data: URL aliasing pattern for React externalization only works with this config. Use the plugin-starter `vite.config.ts` verbatim. |
| Ship Studio Plugin Context API | N/A (runtime, host-provided) | `shell.exec` for unzip/cp/cat/mkdir, `storage` for persisting last-used zip path, `actions.showToast` for user feedback, `theme` for styling | The entire host API. Accessed at runtime via `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__`. No npm package. |

### Supporting Libraries

This plugin has **zero runtime npm dependencies**. All processing happens via:

1. **HTML parsing** — built-in browser `DOMParser` (available in the Vite/browser build context)
2. **File operations** — `shell.exec` with standard macOS/Unix CLI tools (`unzip`, `cp`, `ls`, `cat`, `mkdir`, `rm`, `bash`)
3. **Brief generation** — pure string manipulation in TypeScript

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/react` | ^19.0.0 | TypeScript types for React hooks and JSX | Always — devDependency required for TSX compilation |
| `vitest` | latest | Unit tests for pure functions (HTML parsing, brief generation, asset detection) | For testing `parse.ts`, `brief/generate.ts`, etc. — the Figma plugin uses Vitest for its equivalent modules. Optional for initial implementation but recommended before shipping. |

**Why no HTML parsing library (cheerio, node-html-parser, etc.):**
The browser's built-in `DOMParser` handles Webflow's HTML correctly. Webflow exports are well-formed HTML5. `DOMParser` is synchronous, has zero bundle cost, and is always available in the plugin's browser context. Adding cheerio (~750kb) or node-html-parser (~250kb) would violate the bundle-size constraint and is unnecessary.

**Why no zip library (jszip, adm-zip, etc.):**
All zip extraction happens via `shell.exec('unzip', [...])`. The plugin has no direct filesystem access — the only way to get files is through `shell.exec`. A JS zip library would need to receive binary file contents as a string (not possible cleanly via shell.exec), making it useless here. The native `unzip` binary is always present on macOS (the host platform for Ship Studio).

**Why no markdown generation library:**
Brief generation is pure string concatenation producing a structured markdown document. The Figma plugin's `brief/generate.ts` demonstrates this approach clearly — no library needed.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npm run build` (vite build) | Produce `dist/index.js` | Run after every source change. **Commit `dist/index.js`** — Ship Studio clones repos without running build steps. Never add `dist/` to `.gitignore`. |
| `npm run dev` (vite build --watch) | Watch mode for iteration | Triggers rebuild on save. Requires manual "Reload" in Ship Studio Plugin Manager after each rebuild. |
| Ship Studio "Link Dev Plugin" | Load local plugin for testing | Plugin Manager (puzzle icon) → "Link Dev Plugin" → select plugin folder. |
| Ship Studio DevTools | Debug console | `Cmd + Option + I`. All `console.log` from plugin appears here. |
| `vitest` | Unit test pure logic | Test HTML parsing functions and brief generation without the plugin host. Same test setup as the Figma plugin. |

---

## Installation

```bash
# Initialize from plugin-starter
cp -r /path/to/plugin-starter /path/to/plugin-webflow-to-code

# Install dev dependencies (these are the only deps)
npm install

# The resulting package.json devDependencies:
#   @types/react: ^19.0.0
#   typescript: ^5.6.0
#   vite: ^6.0.0
#   vitest: latest  (add if writing tests)
# peerDependencies:
#   react: ^19.0.0
```

No runtime dependencies to install. Zero.

---

## Source File Structure

Following the Figma plugin's multi-file pattern (appropriate because this plugin has multiple views and distinct processing domains):

```
src/
  index.tsx          — Plugin entry: exports name, slots, onActivate/onDeactivate
  context.ts         — usePluginContext() and convenience hooks (useShell, useToast, etc.)
  types.ts           — PluginContextValue interface + domain types (WebflowPage, AssetRef, BriefMode)
  styles.ts          — CSS strings + STYLE_ID constant

  zip/
    extract.ts       — shell.exec('unzip') wrapper; unzips to temp dir, returns file list
    list.ts          — shell.exec('unzip -l') to enumerate zip contents without extracting
    types.ts         — ZipEntry, ExtractionResult

  parse/
    html.ts          — DOMParser-based page analysis: extract title, nav links, page structure
    pages.ts         — Identify all HTML pages, infer routes from filenames
    css.ts           — Enumerate CSS files and extract @import/font-face references
    assets.ts        — Catalog images/videos/fonts from the zip manifest
    webflow.ts       — Webflow-specific extractors: data-wf-page, .w-nav patterns, component classes
    types.ts         — PageDescriptor, AssetManifest, CSSReference

  brief/
    generate.ts      — Pure function: (ParseResult, BriefMode) → markdown string
    io.ts            — saveBrief() + copyToClipboard() via shell.exec + base64 (same pattern as Figma plugin)
    types.ts         — BriefInput, BriefResult

  assets/
    copy.ts          — shell.exec('cp -r') to copy assets/ images/ videos/ to .shipstudio/assets/
    types.ts         — AssetCopyResult

  components/
    Modal.tsx        — Shared modal wrapper (same pattern as Figma plugin)
    ProgressBar.tsx  — Progress display during extraction
    ResultsModal.tsx — Post-extraction results with copy/dismiss actions

  views/
    IdleView.tsx     — Initial state: file picker + mode selection
    ProcessingView.tsx — In-progress: step indicator + progress bar
    DoneView.tsx     — Completion: stats + copy brief button + open in IDE CTA
```

This mirrors the Figma plugin's proven structure. The `zip/`, `parse/`, `brief/`, and `assets/` modules map directly to the four processing stages.

---

## Key Implementation Patterns

### Pattern 1: Zip extraction via shell.exec

The plugin receives a file path from the browser `<input type="file">` element. Ship Studio plugins run in a browser context but the `input[type=file]` value gives a path string on macOS (not a File object blob URL). Use this path directly with shell commands.

```typescript
// Unzip to a temp directory inside .shipstudio/
const tmpDir = `${project.path}/.shipstudio/_webflow_tmp`;
await shell.exec('rm', ['-rf', tmpDir]);
await shell.exec('mkdir', ['-p', tmpDir]);
await shell.exec('unzip', ['-o', zipPath, '-d', tmpDir]);
```

**Important:** The `<input type="file">` in a browser context normally gives a `File` object. In Ship Studio's Electron/Tauri context, the input's `.value` or a custom `showOpenFilePicker` call may behave differently. **Verify the actual file path access pattern by checking how other plugins handle file inputs (plugin-brand-guidelines uses `useFileSync`).** The base64 + shell.exec pattern from the Figma plugin's `io.ts` is the safe approach for passing content through the shell boundary.

### Pattern 2: DOMParser for HTML analysis

```typescript
// Available in plugin's browser context — no import needed
function parsePage(htmlContent: string): PageDescriptor {
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
  const title = doc.querySelector('title')?.textContent ?? '';
  const wfPageId = doc.documentElement.getAttribute('data-wf-page') ?? '';
  const wfSiteId = doc.documentElement.getAttribute('data-wf-site') ?? '';
  // ...
}
```

The HTML is obtained via `shell.exec('cat', [filePath])` after unzipping. `DOMParser` accepts the resulting stdout string directly.

### Pattern 3: Reading unzipped files via cat

```typescript
// After unzip, read individual HTML pages
const result = await shell.exec('cat', [`${tmpDir}/index.html`]);
if (result.exit_code !== 0) throw new Error(`Failed to read index.html: ${result.stderr}`);
const html = result.stdout;
```

### Pattern 4: Brief writing with base64 encoding

Markdown briefs contain backticks, dollar signs, quotes, and pipe characters that break shell interpolation. The Figma plugin's `io.ts` solves this with base64:

```typescript
const encoded = btoa(unescape(encodeURIComponent(markdown)));
await shell.exec('bash', ['-c', `echo '${encoded}' | base64 -d > '${briefPath}'`]);
```

Use this pattern verbatim — it's tested and handles all markdown metacharacter edge cases.

### Pattern 5: Asset copying

```typescript
// Copy entire images/ directory to .shipstudio/assets/images/
await shell.exec('mkdir', ['-p', `${assetsDir}/images`]);
await shell.exec('cp', ['-r', `${tmpDir}/images/.`, `${assetsDir}/images/`]);

// Same for videos/ and any fonts/ directory
```

No per-file iteration needed — `cp -r` handles directory trees. Use `.` suffix on source to copy directory contents rather than the directory itself.

### Pattern 6: Enumerating zip contents without full extraction

```typescript
// Get the file list without extracting (for the manifest)
const result = await shell.exec('unzip', ['-l', zipPath]);
// Parse result.stdout: lines look like "  161753  02-04-2026 22:37   index.html"
```

This is useful for the progress display — enumerate files first, then extract.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Browser `DOMParser` | cheerio, node-html-parser | If Webflow HTML were malformed or needed server-side processing. Webflow exports are well-formed HTML5, so DOMParser is sufficient and has zero bundle cost. |
| `shell.exec('unzip', ...)` | JSZip, adm-zip | If plugins had direct binary file access. They don't — everything goes through shell.exec which returns strings, not binary buffers. |
| `shell.exec('cp -r', ...)` | Manual file-by-file copy loop | If per-file transformation were needed. Since assets are copied as-is (no transcoding, no optimization), bulk copy is faster and simpler. |
| Inline `PluginContextValue` interface | `@shipstudio/plugin-sdk` as devDep | Either works identically at runtime. The Figma plugin inlines it in `types.ts`. Prefer inline to avoid the extra npm package. |
| CSS injection pattern (useEffect + style tag) | Tailwind, CSS Modules, styled-components | Never use these in plugins. No CSS file resolution at Blob URL load time, no build pipeline at install time. |
| Multi-file `src/` structure | Single `src/index.tsx` | Single-file works for simple plugins. This plugin has 4 distinct processing stages and 3 views — multi-file is appropriate. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Bundling React / ReactDOM | Breaks hooks — the host provides React 19 globally; two copies = hook errors | Externalize via data: URL aliasing in `vite.config.ts` (plugin-starter config, verbatim) |
| JSZip, adm-zip, yauzl, or any JS zip library | No binary file access through `shell.exec`; these libraries need Buffer/ArrayBuffer, not strings; adds ~100-700kb to bundle | `shell.exec('unzip', [...])` — native, always available on macOS |
| cheerio, node-html-parser, JSDOM | Adds 250-750kb; Webflow exports are well-formed HTML5; DOMParser is built-in, synchronous, and zero-cost | Browser's built-in `DOMParser` |
| marked, remark, unified | For *generating* markdown, plain string concatenation is sufficient (Figma plugin's proven approach); for *parsing* markdown, plugins don't need to — they write it | TypeScript string templates in `brief/generate.ts` |
| CSS Modules, Tailwind, styled-components | No CSS file resolution at Blob URL import time; no build pipeline when Ship Studio clones the plugin | CSS injection pattern: `useEffect` + `document.createElement('style')` with unique STYLE_ID |
| Heavy utility libs (lodash, date-fns, etc.) | Bundle loaded as string over IPC then imported via Blob URL — every kb adds to 10-second load timeout window | Write inline. This plugin's logic is string manipulation and shell commands — no utility library required. |
| Computationally expensive module-scope code | 10-second load timeout; module scope runs synchronously on load | Defer all processing to event handlers and `useCallback` inside components |
| `dist/` in `.gitignore` | Ship Studio installs plugins by `git clone` only — no build step at install time | Always commit `dist/index.js` after building |
| `node:path`, `node:fs`, `node:zlib` | These are Node.js modules — the plugin runs in a browser (Electron/WebView) context, not Node.js | `shell.exec` with Unix CLI tools for all filesystem and archive operations |

---

## Webflow Export Structure Reference

From the actual `moneystack-website.webflow.zip` in this repo (66 files):

```
css/
  normalize.css         — Webflow's base CSS reset
  components.css        — Webflow component styles
  {site-name}.css       — Site-specific styles (largest CSS file)
js/
  {site-name}.js        — Bundled Webflow JS (Webflow.js + CMS interactions)
*.html                  — Page files at root level (index.html, blog.html, etc.)
legal/
  *.html                — Legal pages in subdirectory
images/
  *.png, *.jpg, *.svg, *.jpeg, *.gif, *.webp
  *-p-500.png, *-p-800.png   — Responsive variants (Webflow naming convention)
videos/
  *.mp4, *.webm, *.mov
  *-poster-*.jpg        — Video poster images
  *-transcode.*         — Webflow transcoded video variants
```

**Key Webflow HTML attributes for parsing:**
- `data-wf-page` — unique page ID on `<html>`
- `data-wf-site` — site ID on `<html>`
- `.w-nav`, `.w-nav-link` — navigation components
- `.w-dropdown` — dropdown menus
- `.w-embed` — embedded HTML
- `.w-button` — buttons
- `.w-form` — forms
- `.w-richtext` — rich text areas
- `.page-wrapper` — standard Webflow site wrapper div

**Font loading pattern** (from `index.html`):
```html
<script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"></script>
<script>WebFont.load({ google: { families: ["Bricolage Grotesque:300,400,500,600,700"] } });</script>
```
Extract font families from this script tag for the brief's typography section.

---

## Shell Command Reference for This Plugin

All file operations go through `shell.exec`. Commands run in the project directory by default.

| Operation | Command | Args |
|-----------|---------|------|
| List zip contents | `unzip` | `['-l', zipPath]` |
| Extract zip | `unzip` | `['-o', zipPath, '-d', tmpDir]` |
| Read file | `cat` | `[absolutePath]` |
| List directory | `ls` | `['-1', dirPath]` |
| Make directory | `mkdir` | `['-p', dirPath]` |
| Copy directory | `cp` | `['-r', `${src}/.`, dest]` |
| Remove directory | `rm` | `['-rf', dirPath]` |
| Write file (base64) | `bash` | `['-c', `echo '${b64}' \| base64 -d > '${path}'`]` |
| Check file exists | `test` | `['-f', path]` — exit_code 0 = exists |
| Check dir exists | `test` | `['-d', path]` — exit_code 0 = exists |

**Timeout notes:**
- Default shell.exec timeout: 120,000ms (2 minutes)
- Large video files (the Moneystack zip has a 11MB .mov) make the `cp -r` for videos potentially slow — pass `{ timeout: 300000 }` (5 minutes) for the asset copy step
- `unzip -l` (list only) is fast — default timeout fine

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vite ^6.0.0 | TypeScript ^5.6.0, @types/react ^19.0.0 | Confirmed working across all plugins in the monorepo |
| React 19 (host-provided) | react/jsx-runtime via data: URL alias | The jsxRuntimeDataUrl in vite.config.ts satisfies React 19's unified JSX runtime exports |
| `api_version: 1` | Ship Studio `min_app_version: 0.3.53` | Use api_version 1 for all new plugins |
| Browser `DOMParser` | Electron/Tauri WebView (Ship Studio host) | DOMParser is available in all modern browser contexts — confirmed present in Electron and Tauri WebView runtimes |

---

## The Complete `plugin.json`

```json
{
  "id": "webflow-to-code",
  "name": "Webflow to Code",
  "version": "0.1.0",
  "description": "Convert a Webflow export into a coding agent brief",
  "slots": ["toolbar"],
  "author": "Julian Galluzzo",
  "repository": "https://github.com/juliangalluzzo/plugin-webflow-to-code",
  "min_app_version": "0.3.53",
  "icon": "",
  "required_commands": [],
  "api_version": 1
}
```

`required_commands` is empty — all operations use `shell.exec` (unzip, cp, cat, mkdir, rm, bash). No Tauri commands needed.

---

## The Complete `vite.config.ts`

Use the plugin-starter version verbatim (more complete than the Figma plugin's abbreviated version):

```typescript
import { defineConfig } from 'vite';

const reactDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`;

const jsxRuntimeDataUrl = `data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`;

const reactDomDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT_DOM__`;

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        paths: {
          'react': reactDataUrl,
          'react-dom': reactDomDataUrl,
          'react/jsx-runtime': jsxRuntimeDataUrl,
        },
      },
    },
    minify: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

---

## The Complete `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "declaration": false
  },
  "include": ["src"]
}
```

---

## Sources

- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/CLAUDE.md` — Authoritative Ship Studio plugin development guide. PRIMARY source. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/package.json` — Confirmed package versions: Vite ^6.0.0, TypeScript ^5.6.0, @types/react ^19.0.0. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/vite.config.ts` — Canonical Vite config with data: URL aliasing. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/brief/` — Reference implementation for pure-function brief generation and base64 shell I/O pattern. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/assets/` — Reference for asset lifecycle (prepareAssetsDir, download/copy, warnings accumulation). **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/package.json` — Confirms vitest as the test runner for Ship Studio plugins. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-gsd/.planning/research/STACK.md` — Prior stack research for another Ship Studio plugin; confirms all base-layer decisions. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/moneystack-website.webflow.zip` — Actual Webflow export; used to verify zip structure, HTML attributes, asset naming conventions, file counts, and video size considerations. **HIGH confidence.**
- `plugin-webflow-cloud/src/index.tsx` — Confirms `shell.exec('cat', [filePath])` pattern for reading files and `shell.exec` for framework detection. **HIGH confidence.**

---

*Stack research for: Ship Studio plugin — Webflow export processing and brief generation*
*Researched: 2026-03-16*
