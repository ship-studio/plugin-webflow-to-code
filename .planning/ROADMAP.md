# Roadmap: Webflow to Code

## Milestones

- ✅ **v1.0 MVP** - Phases 1-5 (shipped 2026-03-16)
- 🚧 **v1.1 Migration Tracker** - Phases 6-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) - SHIPPED 2026-03-16</summary>

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
- [x] 03-01-PLAN.md — Asset types and manifest builder with responsive variant grouping, video grouping, purpose inference (TDD)
- [x] 03-02-PLAN.md — Copy orchestration, ZipStep extension, MainView integration with progress labels

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
- [x] 04-01-PLAN.md — Types, page parsing (title, route, sections, CMS detection), and Webflow component registry with tests (TDD)
- [x] 04-02-PLAN.md — Shared layout detection (data-w-id + class fallback) and buildSiteAnalysis orchestrator (TDD)
- [x] 04-03-PLAN.md — ZipStep 'analyzing' variant and MainView integration with progress and results display

### Phase 5: Brief Generation and Full UI
**Goal**: A complete, mode-aware `brief.md` is generated and written to `.shipstudio/assets/`, and the full plugin UI — mode selector, pipeline orchestration, results panel — is wired together end to end
**Depends on**: Phase 3, Phase 4
**Requirements**: BREF-01, BREF-02, BREF-03, BREF-04
**Success Criteria** (what must be TRUE):
  1. User selects "Pixel Perfect" or "Best Site" mode via radio cards before extraction begins; mode cannot be changed mid-pipeline
  2. The generated brief contains mode-specific behavioral instructions throughout — not just a header label
  3. Brief includes a two-tier multi-session scaffold: a Planning Document (comprehensive site overview) and a Session Tracker (agent-maintained checklist with resume instructions)
  4. `brief.md` is written to `.shipstudio/assets/` and the results UI shows the file path and approximate token count
  5. Brief is written as agent-agnostic markdown and documents all assets, CSS file references, page breakdowns, and Webflow component migration notes in a single coherent document
**Plans:** 2/2 plans complete

Plans:
- [x] 05-01-PLAN.md — Brief types, generateBrief pure function (TDD), and I/O helpers (saveBrief, copyToClipboard)
- [x] 05-02-PLAN.md — ZipStep extension, MainView pipeline integration, results panel with token count and copy button

</details>

### 🚧 v1.1 Migration Tracker (In Progress)

**Milestone Goal:** Evolve the plugin from a brief generator into an end-to-end migration helper — agents create a structured plan file, the plugin reads it live, and users can pause and resume across sessions with one click.

#### Phase 6: Migration Plan Schema and Brief Integration
**Goal**: Users who follow the brief get an agent that creates a structured `migration-plan.json` as its first action — because the brief explicitly instructs it to, and the schema is simple enough that any coding agent produces it correctly
**Depends on**: Phase 5
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04
**Success Criteria** (what must be TRUE):
  1. The generated `brief.md` contains explicit instructions for the agent to create `.shipstudio/migration-plan.json` before writing any code
  2. The schema includes all pages with nested sections/components, each carrying a status field (`pending`, `in-progress`, `complete`)
  3. Shared components (nav, footer) appear as top-level items in the plan schema, not nested under a page
  4. The brief instructs the agent to update each item's status as it completes it — so the file reflects live progress
**Plans**: TBD

Plans:
- [ ] 06-01: Design migration-plan.json schema (TypeScript types, validation, example fixture) with unit tests
- [ ] 06-02: Update brief generation to inject migration plan instructions and schema reference

#### Phase 7: Progress Tracking UI
**Goal**: Users can see exactly where their migration stands — per-page, per-section — without leaving the plugin, and the view refreshes automatically as the agent works
**Depends on**: Phase 6
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04
**Success Criteria** (what must be TRUE):
  1. Plugin shows a list of all pages with each page's name, section count, and a completion fraction (e.g., "3/7 sections")
  2. Clicking a page expands it to show individual sections/components with a checkmark (complete) or pending indicator
  3. An overall progress bar and percentage reflects completion across all items in the plan
  4. The progress view refreshes automatically every 30 seconds by re-reading `.shipstudio/migration-plan.json` via `shell.exec`
**Plans**: TBD

Plans:
- [ ] 07-01: MigrationPlanReader service (poll + parse plan file via shell.exec) with unit tests
- [ ] 07-02: ProgressView component (page list, expandable sections, overall progress bar) wired to plan reader

#### Phase 8: Session Handoff
**Goal**: Users can stop an agent session and resume it later in one click — the plugin tells them when it is waiting for the plan to appear, detects when it does, and provides a ready-to-paste resume prompt
**Depends on**: Phase 7
**Requirements**: HAND-01, HAND-02, HAND-03
**Success Criteria** (what must be TRUE):
  1. After the brief is copied, the plugin shows a "Waiting for plan" state that tells the user the agent must create the plan file before progress tracking begins
  2. The plugin automatically transitions to the progress view the first time `.shipstudio/migration-plan.json` appears (no manual refresh required)
  3. A "Continue Migration" button is visible in the progress view and copies a resume prompt that tells the agent to read the plan file and brief, then continue from where it left off
**Plans**: TBD

Plans:
- [ ] 08-01: Waiting state UI and auto-transition logic (poll for plan file existence, switch view on detection)
- [ ] 08-02: Continue Migration button — resume prompt generation and clipboard copy with confirmation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Plugin Scaffolding | v1.0 | 1/1 | Complete | 2026-03-16 |
| 2. Zip Input and Extraction | v1.0 | 2/2 | Complete | 2026-03-16 |
| 3. Asset Pipeline | v1.0 | 2/2 | Complete | 2026-03-16 |
| 4. Site Analysis | v1.0 | 3/3 | Complete | 2026-03-16 |
| 5. Brief Generation and Full UI | v1.0 | 2/2 | Complete | 2026-03-16 |
| 6. Migration Plan Schema and Brief Integration | v1.1 | 0/2 | Not started | - |
| 7. Progress Tracking UI | v1.1 | 0/2 | Not started | - |
| 8. Session Handoff | v1.1 | 0/2 | Not started | - |
