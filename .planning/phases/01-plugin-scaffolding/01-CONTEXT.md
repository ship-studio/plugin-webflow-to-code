# Phase 1: Plugin Scaffolding - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up a working Ship Studio plugin shell that loads in the toolbar, opens a modal, and has the correct build/commit cycle. This is pure infrastructure — no extraction, analysis, or brief generation. The modal shows a preview of the real UX (mode selector + file picker placeholder) but none of it is functional yet.

</domain>

<decisions>
## Implementation Decisions

### Plugin Identity
- Plugin ID: `webflow-to-code` (in plugin.json)
- Display name: `Webflow to Code`
- Icon: Use the same Webflow logo SVG from the webflow-cloud plugin (sibling project)
- Package name in package.json: update from starter to match plugin identity

### Modal Shell Design
- Modal size/style: Match the Figma plugin's modal (same dimensions, same centered positioning, same styling patterns)
- Initial view: Show the two mode radio cards ("Pixel Perfect" / "Best Site") and a disabled file picker button — a preview of the real UX that gets wired up in later phases
- None of it is functional in Phase 1 — just visual layout

### Source Structure
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plugin Architecture
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/CLAUDE.md` — Comprehensive plugin API reference: lifecycle, context API, shell.exec patterns, Tauri commands, styling guide
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/src/index.tsx` — Reference implementation of a working plugin entry point
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/vite.config.ts` — Build config with React externalization (copy verbatim)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/tsconfig.json` — TypeScript config (copy verbatim)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/plugin.json` — Manifest template
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/package.json` — Dependencies template

### Sibling Plugin References
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/index.tsx` — Figma plugin entry point (modal pattern to match)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/context.ts` — Plugin context hook pattern
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/styles.ts` — Shared styles pattern
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/components/Modal.tsx` — Modal component to potentially reuse
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/plugin.json` — Reference for manifest conventions

### Icon Source
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-cloud/` — Contains the Webflow logo SVG to copy for the toolbar icon

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Plugin-starter provides verbatim copy files: `vite.config.ts`, `tsconfig.json`, `.gitignore`
- Figma plugin's `usePluginContext()` hook pattern (or `@shipstudio/plugin-sdk` import) — reuse for context access
- Figma plugin's Modal component — can be adapted for consistent modal UX
- Figma plugin's styles.ts — theme-aware inline styles pattern

### Established Patterns
- React externalized via window globals (`__SHIPSTUDIO_REACT__`) — must preserve in vite.config.ts
- All file ops through `shell.exec` — no direct FS access
- `dist/index.js` must be committed — Ship Studio loads without building
- Toolbar slot is the only available UI slot
- Modal opens/closes via toolbar button click

### Integration Points
- Plugin loads via Ship Studio's plugin manager
- Toolbar button appears in workspace toolbar
- Modal renders as overlay within Ship Studio window
- Plugin context provides: project info, shell, storage, actions, theme

</code_context>

<specifics>
## Specific Ideas

- "Get the same Webflow logo SVG from the webflow-cloud plugin" — exact icon source specified
- Modal should show a preview of the real UX from day one (mode cards + file picker) rather than a generic placeholder
- Match the Figma plugin's modal size and positioning for consistency across Ship Studio plugins

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-plugin-scaffolding*
*Context gathered: 2026-03-16*
