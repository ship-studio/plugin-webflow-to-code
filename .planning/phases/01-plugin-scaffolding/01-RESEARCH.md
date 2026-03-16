# Phase 1: Plugin Scaffolding - Research

**Researched:** 2026-03-16
**Domain:** Ship Studio Plugin API / React externalization / Vite build system
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Plugin ID: `webflow-to-code` (in plugin.json)
- Display name: `Webflow to Code`
- Icon: Use the same Webflow logo SVG from the webflow-cloud plugin (sibling project)
- Package name in package.json: update from starter to match plugin identity
- Modal size/style: Match the Figma plugin's modal (same dimensions, same centered positioning, same styling patterns)
- Initial view: Show the two mode radio cards ("Pixel Perfect" / "Best Site") and a disabled file picker button — a preview of the real UX that gets wired up in later phases. None of it is functional in Phase 1 — just visual layout.
- Pre-create directory structure from day one:
  - `src/views/` — MainView, future SettingsView
  - `src/zip/` — zip extraction logic (Phase 2)
  - `src/assets/` — asset copying and manifest (Phase 3)
  - `src/analysis/` — HTML parsing, page analysis, Webflow intelligence (Phase 4)
  - `src/brief/` — brief generation and I/O (Phase 5)
  - `src/components/` — shared UI components (Modal, etc.)
- Entry point: `src/index.tsx` with toolbar button and modal shell
- Shared files at src/ root: `types.ts`, `context.ts`, `styles.ts`

### Claude's Discretion

- Whether to copy and adapt shared patterns from the Figma plugin (context hook, styles, Modal component) vs writing fresh — use whatever is most pragmatic
- Exact CSS/styling approach within the modal
- README content

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | Plugin follows Ship Studio conventions (toolbar slot, externalized React, shell.exec for file ops, committed dist/) | Fully documented in plugin-starter/CLAUDE.md; vite.config.ts handles React externalization via data: URLs; dist/ must NOT be in .gitignore |
| INFR-02 | Plugin uses the plugin-starter template structure (plugin.json, vite.config.ts, tsconfig.json) | All three files located and read verbatim from plugin-starter; copy-exact approach documented below |
</phase_requirements>

---

## Summary

Ship Studio plugins are React components loaded from a committed `dist/index.js` bundle. The host app shares its own React instance via `window.__SHIPSTUDIO_REACT__` — bundling a separate React copy breaks hooks. Vite handles this via data: URL aliasing (not standard externals), which is the most fragile part of the build config and must be copied verbatim from plugin-starter.

The plugin-starter provides three verbatim-copy config files (`vite.config.ts`, `tsconfig.json`, `plugin.json`) and a reference `src/index.tsx` that demonstrates the full API surface. The Figma sibling plugin provides the exact modal architecture to replicate — a reusable `Modal` component with injected CSS, overlay/escape/click-outside close behaviors, and a slot-based child content pattern. The Webflow logo SVG already exists as an inline SVG component in the webflow-cloud sibling plugin.

Phase 1 is strictly scaffolding: the correct files in the correct places, with a visually complete but non-functional modal shell showing mode cards and a disabled file picker. No logic, no real actions. The single critical success criterion beyond visual appearance is that `dist/index.js` is built and committed so Ship Studio can load the plugin.

**Primary recommendation:** Copy plugin-starter config files verbatim, copy and adapt the Figma plugin's Modal component and styles.ts, and implement a minimal MainView component with the mode selector UI. Keep `onActivate`/module scope lightweight.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | ^6.0.0 | Build bundler | Provides data: URL aliasing for React externalization; required by plugin-starter |
| TypeScript | ^5.6.0 | Language | Strict mode; moduleResolution: bundler; jsx: react-jsx |
| React (peer) | ^19.0.0 | UI framework | Provided by host app via window globals; do NOT bundle |
| @types/react | ^19.0.0 | TypeScript types | Dev-only type support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @shipstudio/plugin-sdk | latest | Type imports only | Optional — inline PluginContextValue interface is equivalent and avoids extra dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline PluginContextValue | @shipstudio/plugin-sdk | SDK adds a dependency but exports identical types; for Phase 1 inline is simpler |
| Injected CSS (styles.ts pattern) | Tailwind, CSS modules | Neither available without bundler changes; injected CSS is the established Ship Studio plugin pattern |

**Installation:**
```bash
npm install
```
(Copies package.json from plugin-starter — all deps already defined. Run `npm install` after creating package.json.)

---

## Architecture Patterns

### Recommended Project Structure
```
plugin-webflow-to-code/
├── plugin.json              # Manifest (id, name, icon, slots, api_version)
├── package.json             # Verbatim from plugin-starter, name updated
├── vite.config.ts           # Verbatim from plugin-starter (React externalization)
├── tsconfig.json            # Verbatim from plugin-starter
├── dist/
│   └── index.js             # COMMITTED to git — Ship Studio loads this
├── src/
│   ├── index.tsx            # Entry: ToolbarButton + module exports
│   ├── types.ts             # PluginContextValue interface + shared types
│   ├── context.ts           # usePluginContext() hook
│   ├── styles.ts            # STYLE_ID + PLUGIN_CSS string (injected)
│   ├── components/
│   │   └── Modal.tsx        # Reusable modal shell (adapted from Figma plugin)
│   ├── views/
│   │   └── MainView.tsx     # Mode selector cards + disabled file picker
│   ├── zip/                 # Empty placeholder (Phase 2)
│   ├── assets/              # Empty placeholder (Phase 3)
│   ├── analysis/            # Empty placeholder (Phase 4)
│   └── brief/               # Empty placeholder (Phase 5)
```

### Pattern 1: React Externalization via data: URLs
**What:** Vite aliases `react`, `react-dom`, and `react/jsx-runtime` to inline data: URLs that re-export from `window.__SHIPSTUDIO_REACT__` and `window.__SHIPSTUDIO_REACT_DOM__`.
**When to use:** Always — every Ship Studio plugin must use this exact config.
**Example:**
```typescript
// Source: plugin-starter/vite.config.ts (copy verbatim)
const reactDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`;

const jsxRuntimeDataUrl = `data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`;

const reactDomDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT_DOM__`;

export default defineConfig({
  build: {
    lib: { entry: 'src/index.tsx', formats: ['es'], fileName: () => 'index.js' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { paths: { 'react': reactDataUrl, 'react-dom': reactDomDataUrl, 'react/jsx-runtime': jsxRuntimeDataUrl } },
    },
    minify: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

### Pattern 2: Plugin Context Hook (Figma plugin pattern — preferred)
**What:** `usePluginContext()` returns null instead of throwing, for safe optional chaining.
**When to use:** When the component may render before the context is fully available.
**Example:**
```typescript
// Source: plugin-figma/src/context.ts
const _w = window as any;

export function usePluginContext(): PluginContextValue | null {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;
  if (CtxRef && React?.useContext) {
    return React.useContext(CtxRef) as PluginContextValue | null;
  }
  return null;
}
```

### Pattern 3: Modal with CSS Injection (Figma plugin Modal.tsx)
**What:** Modal component injects CSS on open, cleans up on unmount. Overlay blocks interaction, Escape/click-outside close.
**When to use:** This exact pattern for the Webflow to Code modal shell.
**Example:**
```typescript
// Source: plugin-figma/src/components/Modal.tsx
export function Modal({ open, onClose, title, headerRight, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = PLUGIN_CSS;
      document.head.appendChild(style);
    }
    return () => { document.getElementById(STYLE_ID)?.remove(); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleOverlayClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="figma-plugin-overlay" onClick={handleOverlayClick}>
      <div className="figma-plugin-modal">
        <div className="figma-plugin-modal-header">...</div>
        <div className="figma-plugin-modal-body">{children}</div>
      </div>
    </div>
  );
}
```

### Pattern 4: Module Exports (required by Ship Studio loader)
**What:** Every plugin must export `name`, `slots`, and optionally `onActivate`/`onDeactivate`.
**When to use:** Always — mandatory.
**Example:**
```typescript
// Source: plugin-starter/src/index.tsx
export const name = 'Webflow to Code';
export const slots = { toolbar: ToolbarButton };
export function onActivate() { console.log('[webflow-to-code] Plugin activated'); }
export function onDeactivate() { console.log('[webflow-to-code] Plugin deactivated'); }
```

### Pattern 5: Toolbar Button with Modal Toggle
**What:** Toolbar slot renders a button using `className="toolbar-icon-btn"` (host CSS class). Button state tracks modal open/closed.
**Example:**
```typescript
// Source: plugin-starter/src/index.tsx and plugin-figma/src/index.tsx
function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button onClick={() => setModalOpen(true)} title="Webflow to Code" className="toolbar-icon-btn">
        <WebflowIcon />
      </button>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Webflow to Code">
        {/* content */}
      </Modal>
    </>
  );
}
```

### Pattern 6: Webflow Logo SVG (from plugin-webflow-cloud)
**What:** The Webflow 'W' logo as an inline SVG component. Already used in the sibling plugin.
**Example:**
```typescript
// Source: plugin-webflow-cloud/src/index.tsx — WebflowIcon component
function WebflowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 1080 674" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M1080 0L735.385 673.684H411.695L555.915 394.481H549.444C430.463 548.934 252.941 650.61 -0.000976562 673.684V398.344C-0.000976562 398.344 161.812 388.787 256.938 288.776H-0.000976562V0.0053214H288.77V237.515L295.252 237.489L413.254 0.0053214H631.644V236.009L638.125 235.999L760.555 0H1080Z" />
    </svg>
  );
}
```

### Pattern 7: Mode Card UI (from Figma plugin styles.ts)
**What:** The Figma plugin already has `.figma-plugin-mode-card` styles for radio-style card selection. Adapt these CSS classes for the Webflow to Code modal.
**Key CSS properties already defined in the Figma plugin:**
- `.figma-plugin-mode-card` — padding, border-radius, bg-secondary, border, cursor, transition
- `.figma-plugin-mode-card.selected` — `border-color: var(--accent)`
- `.figma-plugin-mode-card-name` — 11px, font-weight 600
- `.figma-plugin-mode-card-desc` — 10px, text-muted

### Anti-Patterns to Avoid
- **Using `__SHIPSTUDIO_PLUGIN_CONTEXT__` directly** (like webflow-cloud does): Use `__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` with `React.useContext` (plugin-starter/Figma pattern) — the `_REF__` pattern is the current standard for context isolation between multiple plugins.
- **Modifying vite.config.ts**: The data: URL aliasing is non-obvious. Any deviation breaks React hook sharing. Copy verbatim.
- **Adding `dist/` to .gitignore**: Ship Studio won't run a build step on install. Bundle must be committed.
- **Heavy module-scope work**: The plugin has a 10-second load timeout. Defer all async work to effects or callbacks.
- **Creating separate Modal state in context**: Keep modal open/closed state local to ToolbarButton — no global state needed in Phase 1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal close on Escape | Custom keyboard manager | `useEffect` with `document.addEventListener('keydown', ...)` per Modal.tsx pattern | See Figma plugin — handles cleanup correctly |
| Modal close on overlay click | Custom click detection | `e.target === e.currentTarget` guard on overlay div | Established pattern, handles event bubbling correctly |
| CSS injection and cleanup | Custom style manager | `useEffect` with `document.getElementById(STYLE_ID)` guard | Figma plugin pattern prevents duplicate injection |
| React hook access from plugin | Direct React import | `window.__SHIPSTUDIO_REACT__` via vite.config.ts aliasing | Direct bundled React breaks shared hook state |
| Theme-aware colors | Hard-coded hex values | `var(--bg-primary)`, `var(--border)`, etc. in injected CSS | Host CSS variables update automatically with theme |

**Key insight:** Every "I'll just build it myself" impulse here has a pre-solved version in either plugin-starter or plugin-figma. Read those files before writing a single line.

---

## Common Pitfalls

### Pitfall 1: Bundled React Copy
**What goes wrong:** Plugin loads but React hooks throw "Invalid hook call" or "Cannot read property of undefined". Modal opens then immediately crashes.
**Why it happens:** A dependency (or accidental import) pulls in its own bundled React, creating two React instances.
**How to avoid:** Keep only `@types/react` in devDependencies (NOT `react` as a regular dep). Confirm vite.config.ts data: URL aliases are present and cover all three paths (`react`, `react-dom`, `react/jsx-runtime`).
**Warning signs:** Bundle size > ~20KB for a simple modal; `window.__SHIPSTUDIO_REACT__` !== the React seen by hooks.

### Pitfall 2: dist/index.js Not Committed
**What goes wrong:** Ship Studio shows "Plugin bundle not found" error when loading the plugin from a git clone.
**Why it happens:** Developer ran `npm run build` but didn't commit `dist/index.js`, or `dist/` is in `.gitignore`.
**How to avoid:** After every build, `git add dist/index.js && git commit`. Never add `dist/` to `.gitignore`.
**Warning signs:** Plugin works when linked via "Link Dev Plugin" (local path) but fails after install from GitHub.

### Pitfall 3: context.ts Using Old `__SHIPSTUDIO_PLUGIN_CONTEXT__` Pattern
**What goes wrong:** Plugin appears to work in isolation but breaks when multiple plugins are installed simultaneously.
**Why it happens:** The `__SHIPSTUDIO_PLUGIN_CONTEXT__` global is the old single-context pattern. The `__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` + `React.useContext(CtxRef)` pattern provides isolated context per plugin.
**How to avoid:** Use the plugin-starter/plugin-figma pattern for `usePluginContext()`. The webflow-cloud plugin uses the older pattern — do NOT copy it for `context.ts`.
**Warning signs:** Context values from one plugin appearing in another plugin's components.

### Pitfall 4: CSS Class Namespace Collision
**What goes wrong:** Styles from this plugin accidentally affect other plugins or the host app UI.
**Why it happens:** Generic class names like `.modal`, `.overlay`, `.btn` may conflict.
**How to avoid:** Prefix all CSS classes with the plugin ID: `wf2c-modal-overlay`, `wf2c-modal`, `wf2c-mode-card`, etc. Use a `STYLE_ID = 'webflow-to-code-styles'` sentinel.
**Warning signs:** Figma plugin's modal or host UI elements showing unexpected styles after this plugin loads.

### Pitfall 5: Heavy Module Scope Blocking Load
**What goes wrong:** Plugin fails to load (10-second timeout), showing "!" error indicator in toolbar.
**Why it happens:** Top-level async operations, heavy computations, or storage reads at module scope.
**How to avoid:** No async calls at module scope. Put all initialization in `onActivate()` or component `useEffect` hooks.
**Warning signs:** Slow plugin activation; "Plugin load timeout" in dev tools console.

### Pitfall 6: Placeholder Directories Without .gitkeep
**What goes wrong:** Empty directories (`src/zip/`, `src/assets/`, etc.) don't get committed to git.
**Why it happens:** Git doesn't track empty directories.
**How to avoid:** Add a `.gitkeep` file to each placeholder directory, or a minimal `index.ts` with a comment.
**Warning signs:** After fresh clone, `src/zip/`, `src/assets/` etc. are missing.

---

## Code Examples

### plugin.json (final values)
```json
{
  "id": "webflow-to-code",
  "name": "Webflow to Code",
  "version": "0.1.0",
  "description": "Convert Webflow exports into structured coding briefs",
  "slots": ["toolbar"],
  "author": "",
  "repository": "",
  "min_app_version": "0.3.53",
  "icon": "",
  "required_commands": [],
  "api_version": 1
}
```

Note: `icon` field can reference a relative path to an SVG file if desired. The Figma plugin uses `"icon": "icon.svg"` as a separate file. However, the webflow-cloud plugin uses no icon file (empty string) and embeds the icon inline in the component. Either works — inline SVG in the component is simpler for Phase 1.

### package.json (final values)
```json
{
  "name": "@shipstudio/plugin-webflow-to-code",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

### MainView — Mode Selector + Disabled File Picker
```typescript
// Source: adapted from plugin-figma/src/styles.ts mode card CSS pattern
// This is purely visual — no state management needed in Phase 1
type Mode = 'pixel-perfect' | 'best-site';

function MainView() {
  const [selectedMode, setSelectedMode] = useState<Mode>('pixel-perfect');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Mode selector */}
      <div>
        <label className="wf2c-label">Conversion Mode</label>
        <div className="wf2c-mode-group">
          <div
            className={`wf2c-mode-card${selectedMode === 'pixel-perfect' ? ' selected' : ''}`}
            onClick={() => setSelectedMode('pixel-perfect')}
          >
            <div className="wf2c-mode-card-name">Pixel Perfect</div>
            <div className="wf2c-mode-card-desc">Exact dimensions, fixed units, preserve Webflow layout</div>
          </div>
          <div
            className={`wf2c-mode-card${selectedMode === 'best-site' ? ' selected' : ''}`}
            onClick={() => setSelectedMode('best-site')}
          >
            <div className="wf2c-mode-card-name">Best Site</div>
            <div className="wf2c-mode-card-desc">Semantic HTML, responsive patterns, modern conventions</div>
          </div>
        </div>
      </div>

      {/* File picker — disabled placeholder */}
      <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
        Select Webflow Export (.zip)
      </button>
    </div>
  );
}
```

### Verifying React externalization (bundle inspection)
```bash
# After build, confirm no bundled React
grep -c "createElement" dist/index.js  # Should be 0 or very low
grep "window.__SHIPSTUDIO_REACT__" dist/index.js  # Should appear in imports
wc -c dist/index.js  # Should be < 20KB for a simple modal
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `__SHIPSTUDIO_PLUGIN_CONTEXT__` global | `__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` + `React.useContext` | Unknown — webflow-cloud still uses old | Old pattern breaks multi-plugin isolation; use new pattern |
| Single `src/index.tsx` monolith | Split into `context.ts`, `styles.ts`, `components/Modal.tsx`, `views/` | Figma plugin established this | Better maintainability; required by the multi-phase directory structure |

**Deprecated/outdated:**
- `__SHIPSTUDIO_PLUGIN_CONTEXT__` direct access: The webflow-cloud plugin still uses this. Do not replicate it. Use the plugin-starter / plugin-figma `CtxRef` + `useContext` pattern.

---

## Open Questions

1. **Icon in plugin.json: inline SVG component vs external icon.svg file**
   - What we know: `plugin.json` has an `icon` field for a relative path; Figma plugin uses `"icon": "icon.svg"`; webflow-cloud uses inline SVG with `"icon": ""`. Both approaches work for the toolbar button (which renders the component SVG regardless).
   - What's unclear: Whether the `icon` field in plugin.json is used in the Plugin Manager UI (install dialog, plugin list) vs purely the toolbar button.
   - Recommendation: For Phase 1, use `"icon": ""` and embed the Webflow SVG inline in the component. If the Plugin Manager UI shows the icon field, add an `icon.svg` file in Phase 1 cleanup or Phase 2.

2. **Placeholder directory strategy: .gitkeep vs minimal index.ts**
   - What we know: Git ignores empty directories.
   - What's unclear: Whether future phases will import from these directories with barrel exports.
   - Recommendation: Use `.gitkeep` for now (simplest). Phase 2+ implementer can replace with actual modules.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — Ship Studio plugin projects do not include a test framework by default |
| Config file | None — see Wave 0 |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-01 | dist/index.js exists and has no bundled React | smoke | `node -e "const fs=require('fs'); const b=fs.readFileSync('dist/index.js','utf8'); if(b.includes('window.__SHIPSTUDIO_REACT__') && b.length < 100000) process.exit(0); process.exit(1);"` | ❌ Wave 0 |
| INFR-01 | Plugin exports name, slots.toolbar | smoke | `node --input-type=module -e "import * as p from './dist/index.js'; if(!p.name||!p.slots?.toolbar) process.exit(1);"` | ❌ Wave 0 (build must exist first) |
| INFR-02 | plugin.json has correct id, api_version, slots | smoke | `node -e "const m=JSON.parse(require('fs').readFileSync('plugin.json','utf8')); if(m.id!=='webflow-to-code'||m.api_version!==1||!m.slots.includes('toolbar')) process.exit(1);"` | ❌ Wave 0 |
| INFR-02 | vite.config.ts, tsconfig.json exist | manual/smoke | `ls vite.config.ts tsconfig.json` | ❌ Wave 0 |

**Note:** Ship Studio provides no test harness for rendering plugin components in isolation. Component-level tests require Vitest + @testing-library/react with a mocked context, which is disproportionate overhead for Phase 1 scaffolding. The smoke tests above (bundle inspection + JSON validation) cover the automatable requirements. Visual/interaction verification must be done manually via "Link Dev Plugin" in Ship Studio.

### Sampling Rate
- **Per task commit:** `npm run build && node -e "const b=require('fs').readFileSync('dist/index.js','utf8'); console.log('Bundle size:', b.length, 'bytes'); if(!b.includes('__SHIPSTUDIO_REACT__')) throw new Error('React not externalized');"`
- **Per wave merge:** Full smoke suite (bundle check + JSON validation)
- **Phase gate:** Manual verification in Ship Studio — plugin appears in toolbar, modal opens, no console errors

### Wave 0 Gaps
- [ ] `scripts/smoke-check.sh` — covers INFR-01 (bundle inspection) and INFR-02 (JSON validation)
- [ ] Smoke check can be a simple inline node command — no framework install required

---

## Sources

### Primary (HIGH confidence)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/CLAUDE.md` — Complete Ship Studio plugin API reference: lifecycle, context, shell, invoke, styling, constraints
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/src/index.tsx` — Reference implementation, all patterns verified by reading
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/vite.config.ts` — Verbatim build config (React externalization)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/tsconfig.json` — Verbatim TypeScript config
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/plugin.json` — Manifest template
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/package.json` — Dependency versions
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/index.tsx` — Modal architecture, context hook usage pattern
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/context.ts` — `usePluginContext()` null-return pattern
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/styles.ts` — Full CSS including mode card classes
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/components/Modal.tsx` — Modal component (CSS injection, escape, overlay click)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/plugin.json` — Manifest conventions (icon.svg pattern)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-cloud/src/index.tsx` — Webflow logo SVG (WebflowIcon component)

### Secondary (MEDIUM confidence)
- None needed — all critical information sourced from canonical project files

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — read directly from plugin-starter package.json and vite.config.ts
- Architecture: HIGH — read from three working sibling plugins; patterns are consistent
- Pitfalls: HIGH — some from CLAUDE.md explicit warnings; CSS collision and .gitkeep from reasoning about the stack
- Validation: MEDIUM — Ship Studio has no test harness; smoke commands are untested but logically sound

**Research date:** 2026-03-16
**Valid until:** 2026-09-16 (stable Ship Studio plugin API; re-verify if min_app_version changes)
