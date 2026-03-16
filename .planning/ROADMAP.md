# Roadmap: Webflow to Code

## Overview

Five phases that build the pipeline from the outside in: establish a working plugin shell, then layer in zip extraction, asset copying, HTML analysis, and finally brief generation — the product's core deliverable. Each phase leaves a fully functional artifact. By Phase 5 the user can select a Webflow export, pick a mode, run extraction, and receive a comprehensive agent-ready brief.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Plugin Scaffolding** - Working plugin shell that loads in Ship Studio with a modal and correct build setup
- [x] **Phase 2: Zip Input and Extraction** - User can select a Webflow zip, extract it, and see step-by-step progress with error handling (completed 2026-03-16)
- [x] **Phase 3: Asset Pipeline** - All media assets copied to `.shipstudio/assets/` with a typed manifest including responsive variant grouping (completed 2026-03-16)
- [x] **Phase 4: Site Analysis** - Full HTML parsing — page discovery, structural breakdowns, Webflow component detection, shared layout identification (completed 2026-03-16)
- [ ] **Phase 5: Brief Generation and Full UI** - Mode-aware `brief.md` written to disk with complete modal UI, mode selector, results panel, and token estimate

## Phase Details

### Phase 1: Plugin Scaffolding
**Goal**: The plugin loads correctly in Ship Studio, appears in the toolbar, opens a modal, and the build/commit cycle is confirmed working
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02
**Success Criteria** (what must be TRUE):
  1. Plugin appears in the Ship Studio toolbar and clicking it opens a modal without errors
  2. Modal renders with externalized React (no bundled React copy — verified via bundle inspection)
  3. `dist/index.js` is built via Vite and committed to git; Ship Studio can load the plugin from a git clone with no build step
  4. Plugin file structure matches plugin-starter conventions (plugin.json, vite.config.ts, tsconfig.json, src/index.tsx)
**Plans:** 1/1 plans complete
Plans:
- [x] 01-01-PLAN.md — Scaffold plugin config, source files, build output, and modal shell with mode selector preview

### Phase 2: Zip Input and Extraction
**Goal**: Users can select a Webflow export zip, the plugin extracts it to a temp directory, validates it is a real Webflow export, and shows named progress steps throughout
**Depends on**: Phase 1
**Requirements**: ZIP-01, ZIP-02, ZIP-03, ZIP-04
**Success Criteria** (what must be TRUE):
  1. User can click a file picker in the modal and select a `.zip` file
  2. Plugin extracts the zip to a temp directory under `.shipstudio/` via `shell.exec unzip`
  3. Plugin validates that the zip contains `index.html` and CSS files; shows a clear error message if it does not
  4. User sees named progress labels during processing ("Extracting zip...", "Copying assets...", "Analyzing pages...", "Generating brief...")
  5. Extracted file count is verified against the `unzip -l` manifest (silent extraction failure is caught)
**Plans:** 2/2 plans complete
Plans:
- [x] 02-01-PLAN.md — Zip extraction core: types, file picker, extraction with count verification, Webflow validation, and unit tests
- [x] 02-02-PLAN.md — Wire MainView UI with extraction pipeline, progress labels, inline errors, and retry

### Phase 3: Asset Pipeline
**Goal**: All media assets from the Webflow export are copied to `.shipstudio/assets/` and described in a typed manifest that groups responsive image variants
**Depends on**: Phase 2
**Requirements**: ASST-01, ASST-02, ASST-03
**Success Criteria** (what must be TRUE):
  1. All images, SVGs, fonts, and videos from the zip appear in `.shipstudio/assets/` after extraction
  2. The asset manifest lists every copied asset with its path, inferred purpose, and referencing page(s)
  3. Responsive image variants (e.g., `-p-500`, `-p-800`) are grouped under a single base-name entry in the manifest — a 50-image site shows 50 entries, not 300+
**Plans:** 2/2 plans complete
Plans:
- [ ] 03-01-PLAN.md — Asset types and manifest builder with responsive variant grouping, video grouping, purpose inference (TDD)
- [ ] 03-02-PLAN.md — Copy orchestration, ZipStep extension, MainView integration with progress labels

### Phase 4: Site Analysis
**Goal**: Every HTML page in the export is analyzed — page list, routes, structural breakdowns per page, Webflow component recognition, shared layout detection, and CMS template flagging
**Depends on**: Phase 2
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, WFLW-01, WFLW-02, WFLW-03
**Success Criteria** (what must be TRUE):
  1. Plugin produces a list of all HTML pages with title, inferred route, and filename — no pages are silently dropped
  2. Each page has a structural breakdown listing its major sections (nav, hero, features, footer, etc.) and Webflow component inventory
  3. Webflow component classes (`.w-nav`, `.w-dropdown`, `.w-slider`, `.w-tabs`, `.w-form`, `.w-lightbox`, `.w-embed`) are recognized and mapped to semantic descriptions with migration notes
  4. Pages sharing the same nav/footer pattern are flagged as "build once as shared component"
  5. CMS template pages (`detail_*.html` or containing `{{wf ...}}` placeholders) are identified and labeled — not treated as real content pages
**Plans:** 3/3 plans complete
Plans:
- [ ] 04-01-PLAN.md — Types, page parsing (title, route, sections, CMS detection), and Webflow component registry with tests (TDD)
- [ ] 04-02-PLAN.md — Shared layout detection (data-w-id + class fallback) and buildSiteAnalysis orchestrator (TDD)
- [ ] 04-03-PLAN.md — ZipStep 'analyzing' variant and MainView integration with progress and results display

### Phase 5: Brief Generation and Full UI
**Goal**: A complete, mode-aware `brief.md` is generated and written to `.shipstudio/assets/`, and the full plugin UI — mode selector, pipeline orchestration, results panel — is wired together end to end
**Depends on**: Phase 3, Phase 4
**Requirements**: BREF-01, BREF-02, BREF-03, BREF-04
**Success Criteria** (what must be TRUE):
  1. User selects "Pixel Perfect" or "Best Site" mode via radio cards before extraction begins; mode cannot be changed mid-pipeline
  2. The generated brief contains mode-specific behavioral instructions throughout — not just a header label (Pixel Perfect: preserve class names, fixed units; Best Site: semantic HTML, responsive patterns)
  3. Brief includes a two-tier multi-session scaffold: a Planning Document (comprehensive site overview) and a Session Tracker (agent-maintained checklist with resume instructions)
  4. `brief.md` is written to `.shipstudio/assets/` and the results UI shows the file path and approximate token count
  5. Brief is written as agent-agnostic markdown and documents all assets, CSS file references, page breakdowns, and Webflow component migration notes in a single coherent document
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plugin Scaffolding | 1/1 | Complete    | 2026-03-16 |
| 2. Zip Input and Extraction | 2/2 | Complete    | 2026-03-16 |
| 3. Asset Pipeline | 2/2 | Complete    | 2026-03-16 |
| 4. Site Analysis | 3/3 | Complete   | 2026-03-16 |
| 5. Brief Generation and Full UI | 0/TBD | Not started | - |
