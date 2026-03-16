# Phase 3: Asset Pipeline - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Copy all media assets (images, SVGs, fonts, videos, CSS, JS) from the extracted zip temp directory to `.shipstudio/assets/`. Build a typed asset manifest that lists every copied asset with its path, inferred purpose, and referencing page(s). Group responsive image variants (-p-500, -p-800) under a single base-name entry so the manifest doesn't balloon. This phase does NOT analyze HTML structure (Phase 4) or generate the brief (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation decisions for this phase are at Claude's discretion:

- **Asset directory layout**: How to organize files in `.shipstudio/assets/` — flat, mirroring the zip structure (images/, css/, videos/), or reorganized by type
- **Responsive image grouping**: How to detect and group -p-500/-p-800 variants under a single base-name entry, and what the grouped entry looks like in the manifest
- **Manifest data structure**: Fields per asset (path, purpose, type, referencing pages), how purpose is inferred (from directory, filename, or file type), and how page references are determined
- **Copy strategy**: Whether to use individual `shell.exec('cp', ...)` calls or a batch approach like `cp -r`
- **CSS and JS handling**: Whether CSS/JS files go to `.shipstudio/assets/` alongside media or are handled differently (they're referenced in the brief as CSS files, not "assets")

### Locked Decisions (from prior phases)
- Assets destination: `.shipstudio/assets/` (project-level)
- Copy all media including videos — no optimization or transcoding
- All file ops through `shell.exec`
- Extraction temp dir: `.shipstudio/tmp/{sanitized-name}/` (Phase 2)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Implementation
- `src/zip/types.ts` — ZipManifest type with entries[] array (lists all files from zip)
- `src/zip/discover.ts` — parseUnzipManifest (builds manifest from unzip -l), validateWebflowExport
- `src/zip/extract.ts` — extractAndVerify returns ZipManifest with entries and fileCount
- `src/views/MainView.tsx` — Current UI with extraction pipeline (needs to be extended for asset copying step)
- `src/assets/` — Pre-created directory with .gitkeep (implementation goes here)

### Sibling Plugin Patterns
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/assets/download.ts` — Figma plugin's asset download + directory management pattern
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/assets/sanitize.ts` — Filename sanitization
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/brief/generate.ts` — How the Figma plugin structures its asset manifest in the brief

### Webflow Export Structure
- `moneystack-website.webflow.zip` — Sample export with images/ (responsive variants), videos/, css/, js/

### Research
- `.planning/research/ARCHITECTURE.md` — Data flow, asset copying patterns
- `.planning/research/PITFALLS.md` — Responsive image variant inflation (5-6x), font handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ZipManifest.entries[]` — already contains the full file list from extraction, can be used to identify asset files
- `shell.exec` via `usePluginContext()` — all file copy operations
- `buildExtractDir()` — knows the temp extraction path
- MainView's `ZipStep` state machine — needs a new 'copying' step for this phase

### Established Patterns
- `shell.exec('bash', ['-c', ...])` for complex file operations
- `shell.exec('cp', ['-r', src, dest])` for copying
- `shell.exec('mkdir', ['-p', dir])` for creating directories
- wf2c- CSS prefix, btn-primary host class for buttons
- Progress labels inline in modal with file counts

### Integration Points
- MainView.tsx: after 'validating' step, before 'done' — add 'copying' step
- ZipManifest.entries[] feeds into asset identification
- Asset manifest feeds into brief generation (Phase 5)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key outcome is:
1. All media files accessible in `.shipstudio/assets/`
2. A manifest that the brief generator (Phase 5) can consume
3. Responsive variants grouped so the agent sees 50 images, not 300

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-asset-pipeline*
*Context gathered: 2026-03-16*
