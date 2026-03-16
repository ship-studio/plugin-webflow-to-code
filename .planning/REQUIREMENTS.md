# Requirements: Webflow to Code

**Defined:** 2026-03-16
**Core Value:** Users get the "aha moment" — after running the plugin and letting their coding agent work from the brief, they see something that looks almost exactly like their Webflow site, now living in real code.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Zip Input & Extraction

- [x] **ZIP-01**: User can select a Webflow export .zip via file picker in the plugin modal
- [x] **ZIP-02**: Plugin extracts zip contents to a temp directory via shell.exec unzip
- [x] **ZIP-03**: Plugin validates zip structure (checks for index.html, CSS files) and shows clear error for malformed exports
- [x] **ZIP-04**: Plugin shows step-by-step progress labels during processing ("Extracting zip...", "Copying assets...", "Analyzing pages...", "Generating brief...")

### Asset Management

- [x] **ASST-01**: Plugin copies all media assets (images, SVGs, fonts, videos) to `.shipstudio/assets/`
- [x] **ASST-02**: Brief contains an asset manifest table listing every copied asset with path, inferred purpose, and referencing page(s)
- [x] **ASST-03**: Plugin groups responsive image variants (-p-500, -p-800, etc.) as srcset families in the asset manifest

### Page Analysis

- [x] **PAGE-01**: Plugin discovers all HTML pages from the export and extracts title, route, and filename
- [x] **PAGE-02**: Plugin generates a per-page structural breakdown (major sections: nav, hero, features, footer, etc.)
- [x] **PAGE-03**: Brief references original CSS files by path rather than re-extracting design tokens
- [x] **PAGE-04**: Plugin detects shared layout patterns (common nav/footer) across pages and flags them as "build once as shared component"

### Webflow Intelligence

- [x] **WFLW-01**: Plugin recognizes Webflow component classes (.w-nav, .w-dropdown, .w-slider, .w-tabs, .w-form, .w-lightbox, .w-embed) and maps them to semantic descriptions with migration notes
- [x] **WFLW-02**: Plugin detects JavaScript interactions (data-ix, animations, scroll triggers) and documents them in the brief
- [x] **WFLW-03**: Plugin identifies CMS template pages (containing placeholders not content) and flags them with an explanation

### Brief Generation

- [ ] **BREF-01**: User selects between "Pixel Perfect" and "Best Site" modes before extraction via radio cards in the modal
- [x] **BREF-02**: Brief contains mode-specific behavioral instructions (Pixel Perfect: exact dimensions, fixed units; Best Site: semantic HTML, responsive patterns)
- [x] **BREF-03**: Brief includes a multi-session migration scaffold (ordered page list, progress tracking format, resume instructions)
- [x] **BREF-04**: Plugin shows approximate token count in the results UI after brief generation

### Plugin Infrastructure

- [x] **INFR-01**: Plugin follows Ship Studio conventions (toolbar slot, externalized React, shell.exec for file ops, committed dist/)
- [x] **INFR-02**: Plugin uses the plugin-starter template structure (plugin.json, vite.config.ts, tsconfig.json)

## v2 Requirements

### Enhanced Analysis

- **EANA-01**: Inspiration mode (third mode) — adapt Webflow design patterns to an existing codebase
- **EANA-02**: Webflow CMS data export via Webflow API (requires OAuth flow)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Actual code conversion (HTML → React/Next.js) | Plugin prepares the brief; the coding agent does the conversion |
| Framework detection or framework-specific output | Brief is agent-agnostic; agent adapts to the project's framework |
| Design token re-extraction from CSS | Raw CSS files serve as the canonical reference |
| Page filtering/selection UI | All pages always included; agent manages migration order via multi-session scaffold |
| Agent-specific brief variants | Structured markdown works for all capable coding agents |
| Image optimization / video transcoding | Assets copied as-is; optimization is a post-migration concern |
| Drag-and-drop zip input | File picker is consistent with Ship Studio conventions |
| CMS data from Webflow API | Requires auth flow; export zip is the input boundary |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ZIP-01 | Phase 2 | Complete |
| ZIP-02 | Phase 2 | Complete |
| ZIP-03 | Phase 2 | Complete |
| ZIP-04 | Phase 2 | Complete |
| ASST-01 | Phase 3 | Complete |
| ASST-02 | Phase 3 | Complete |
| ASST-03 | Phase 3 | Complete |
| PAGE-01 | Phase 4 | Complete |
| PAGE-02 | Phase 4 | Complete |
| PAGE-03 | Phase 4 | Complete |
| PAGE-04 | Phase 4 | Complete |
| WFLW-01 | Phase 4 | Complete |
| WFLW-02 | Phase 4 | Complete |
| WFLW-03 | Phase 4 | Complete |
| BREF-01 | Phase 5 | Pending |
| BREF-02 | Phase 5 | Complete |
| BREF-03 | Phase 5 | Complete |
| BREF-04 | Phase 5 | Complete |
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation — all 20 requirements mapped*
