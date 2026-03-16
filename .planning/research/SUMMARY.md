# Project Research Summary

**Project:** plugin-webflow-to-code
**Domain:** Ship Studio plugin — Webflow export (.zip) processing and coding-agent brief generation
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

This is a Ship Studio plugin that accepts a Webflow `.zip` export, extracts its contents, analyzes the site structure, and produces a structured `brief.md` that a coding agent can use to migrate the site to a custom codebase. The plugin follows an established pattern in this monorepo (proven by the sibling Figma plugin) and requires zero runtime npm dependencies — all file I/O goes through `shell.exec` with standard Unix tools, HTML parsing uses the browser's built-in `DOMParser`, and brief generation is pure TypeScript string manipulation. The architecture is well-understood, and a reference implementation exists in `plugin-figma`.

The recommended approach is a six-stage sequential pipeline: zip extraction, site discovery, layout parsing, asset copying, brief generation, and brief writing. The pipeline is driven by a `MainView` React component with step-based progress state, and all domain logic is isolated into typed modules (`zip/`, `layout/`, `pages/`, `assets/`, `brief/`). The two-mode system (Pixel Perfect vs Best Site) is a core product differentiator and must produce meaningfully different behavioral instructions in the brief body — not just a header label.

The dominant risk is that the brief underserves the coding agent: it fails to document Webflow's proprietary IX2 interaction system, silently includes CMS template pages as if they have content, or produces a single massive document that exceeds the agent's context window on large sites. These are not edge cases — they affect the majority of real-world Webflow exports. The brief structure must be designed around multi-session agent workflows from the first implementation, not retrofitted later.

---

## Key Findings

### Recommended Stack

The plugin builds on the `plugin-starter` scaffold with a minimal devDependency set: Vite ^6.0.0 (mandatory — the React externalization pattern only works with this config), TypeScript ^5.6.0, and `@types/react ^19.0.0`. React 19 is host-provided and must not be bundled. There are zero runtime npm dependencies. All zip operations use `shell.exec('unzip', ...)`, all file reads use `shell.exec('cat', ...)`, and brief writing uses a base64 encoding pattern (`btoa` + `base64 -d`) proven in the Figma plugin to handle markdown metacharacters safely.

The `dist/index.js` build artifact must be committed to git — Ship Studio installs plugins via `git clone` with no build step. The complete `vite.config.ts` and `tsconfig.json` from `plugin-starter` should be used verbatim.

**Core technologies:**
- React 19 (host-provided): UI layer — externalized via data: URL aliasing in Vite config; bundling own copy breaks hooks
- TypeScript ^5.6.0: Type safety for parsing structs, brief types, and shell result handling
- Vite ^6.0.0: Build tool — the data: URL React externalization pattern is non-negotiable
- Ship Studio Plugin Context API (`shell`, `storage`, `actions`, `project`): Runtime host API via `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__`; no npm package
- Browser `DOMParser`: HTML parsing — zero bundle cost, handles well-formed Webflow HTML5 correctly
- `vitest`: Unit testing for pure functions (`parse.ts`, `brief/generate.ts`)

### Expected Features

The MVP is well-defined. All P1 features are required for a valid v1; none require external APIs or complex state management. The dependency chain is linear: zip picker → extraction → page discovery → parsing → asset copy → brief generation. Mode selection must happen before the pipeline starts — it cannot be changed post-extraction without regenerating the full brief.

**Must have (table stakes):**
- `.zip` file picker — the only practical entry point
- Zip extraction to temp directory under `.shipstudio/` — prerequisite for everything
- Copy all assets (images, videos, fonts, CSS, JS) to `.shipstudio/assets/`
- Page discovery (all HTML files, titles, inferred routes)
- Webflow component pattern recognition (`.w-nav`, `.w-dropdown`, `.w-slider`, `.w-tabs`, `.w-form`, `.w-lightbox`, `.w-embed`)
- Mode selection UI (Pixel Perfect / Best Site) — captured before extraction begins
- Page structural breakdown per page (sections, headings, component inventory)
- Multi-session brief scaffold (Session Tracker, `MIGRATION_LOG.md` instructions, phase-by-page ordering)
- Asset manifest in brief (path, type, inferred purpose, responsive variant grouping)
- CSS reference in brief (paths to `normalize.css`, `components.css`, `{site}.css` — no token re-extraction)
- `brief.md` written to `.shipstudio/assets/` via base64 shell pattern
- Progress feedback UI (named steps: extracting, analyzing, copying, generating)
- Error handling for bad/non-Webflow zips

**Should have (competitive):**
- Shared layout pattern extraction (detect same nav/footer across pages → flag as shared component)
- Responsive image variant grouping in asset manifest (group `-p-500`/`-p-800` variants by base name)
- CMS limitation disclosure per page (detect `detail_*.html` and `{{wf ...}}` placeholders)
- JavaScript interaction inventory (document `data-ix`, `.w-slider`, `.w-tab` interactions requiring rebuild)
- Token estimation in results UI (brief character count / 4 as rough estimate)

**Defer (v2+):**
- Inspiration mode (third mode — partial migration path)
- Webflow CMS export via Webflow API (OAuth, pagination, separate architecture)
- Loom walkthrough video embedded in plugin UI

### Architecture Approach

The plugin uses a layered module architecture with a strict separation between I/O (shell.exec calls) and logic (pure functions). `MainView.tsx` orchestrates the pipeline and owns all state; domain modules (`zip/`, `layout/`, `pages/`, `assets/`, `brief/`) are pure functions or thin shell wrappers. `brief/generate.ts` is a synchronous pure function with no side effects — this keeps it fully unit-testable without mocking the Shell. The architecture directly mirrors the Figma plugin, so there is a working reference for every pattern.

**Major components:**
1. `src/index.tsx` — Plugin entry, toolbar slot, modal, view router, top-level state machine
2. `src/zip/` — Shell-mediated extraction (`unzip`), file listing, file reading via `cat`
3. `src/layout/` — HTML parsing, Webflow class detection, shared layout identification, route inference
4. `src/pages/` — Per-page structural breakdown (sections, headings, component inventory)
5. `src/assets/` — Bulk copy via `cp -r`, filename sanitization, asset manifest construction
6. `src/brief/` — Pure brief assembly (`generate.ts`), mode-aware section builders, base64 file I/O
7. `src/components/` — Modal, ProgressBar, ModeSelector, FilePickerButton, ResultsPanel

**Build order (based on data-flow dependencies):**
Entry scaffolding → zip I/O → asset copying → layout parsing → page analysis → brief generation → full UI wiring

### Critical Pitfalls

1. **IX2 interactions not documented in brief** — The exported `{site}.js` is an opaque Webflow runtime, not declarative animation definitions. The brief must name every interactive component (`.w-nav`, `.w-slider`, `.w-tab`, `.w-dropdown`, `.w-lightbox`) and explicitly instruct the agent to rebuild interactions using native HTML/CSS/JS — not to use or port `webflow.js`.

2. **CMS template pages treated as real pages** — `detail_*.html` files contain `{{wf ...}}` binding placeholders, not content. Parser must detect these via filename pattern and placeholder string presence; brief must label them as "CMS Templates — no content exported" with instructions for dynamic route scaffolding.

3. **Multi-session brief structure absent** — A flat single-document brief exceeds agent context windows on 20+ page sites and provides no resumability. Brief must have a two-tier structure: Planning Document (comprehensive) + Session Tracker (agent-maintained checklist). This must be designed in from the start.

4. **Mode behavioral instructions absent** — Pixel Perfect and Best Site modes must produce different behavioral directives throughout the brief body, not just a header label. The briefs must contain explicit, unambiguous instructions: "Preserve all class names exactly" (Pixel Perfect) vs. "You may rewrite HTML structure using semantic elements" (Best Site).

5. **Responsive image variant inflation** — Webflow generates up to 7 size variants per image (`-p-500` through `-p-3200`). The asset manifest must group variants by base name; a 50-image site should show 50 entries, not 300+.

6. **Markdown injection from Webflow content** — Page titles, class names, and meta content scraped from HTML may contain pipe characters, backticks, and angle brackets that corrupt brief markdown. All Webflow-derived strings must be sanitized before interpolation; class names must always be wrapped in code fences.

7. **Zip extraction silent failure** — `exit_code === 0` is insufficient; always verify extracted file count matches `unzip -l` manifest. Use a 5-minute timeout for extraction and asset copy (not the default 120s).

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Plugin Scaffolding and Entry
**Rationale:** Nothing else can run until the plugin loads, the toolbar button appears, and the modal opens. This is the unblocking foundation.
**Delivers:** A working plugin that opens a modal with placeholder UI, confirms React externalization is correct, and validates the build/commit/reload cycle.
**Addresses:** Entry point foundation; establishes file structure (`index.tsx`, `context.ts`, `types.ts`, `components/Modal.tsx`)
**Avoids:** React bundling pitfall (externalization config must be verified at this stage, not discovered later)
**Research flag:** Standard patterns — skip phase research. Plugin-starter and Figma plugin provide complete reference.

### Phase 2: Zip Extraction and File Discovery
**Rationale:** The entire pipeline depends on a successfully extracted zip with a verified file manifest. Asset copying and HTML parsing cannot start without this.
**Delivers:** `zip/extract.ts` and `zip/discover.ts` — a typed `ZipContents` structure containing categorized file lists (HTML pages, CSS, JS, images, videos, fonts).
**Addresses:** `.zip` file picker, extraction to temp directory, progress feedback (step 1), error handling for bad zips, Webflow zip validation (check for `index.html` + CSS before proceeding)
**Avoids:** Silent extraction failure (Pitfall 7) — implement file count verification and 5-minute timeout here
**Research flag:** Standard patterns — shell.exec unzip pattern is fully documented in STACK.md.

### Phase 3: Asset Copying and Manifest
**Rationale:** Asset copying only requires `ZipContents` from Phase 2 — it does not depend on HTML parsing. Building it early means the asset manifest is available when brief generation is implemented. Also validates the `.shipstudio/assets/` directory structure before brief writing depends on it.
**Delivers:** `assets/copy.ts`, `assets/sanitize.ts`, `assets/manifest.ts` — all assets copied to `.shipstudio/assets/` with a typed manifest.
**Addresses:** Copy assets (images, videos, fonts, CSS, JS), responsive image variant grouping, font directory handling
**Avoids:** Missing fonts pitfall (Pitfall 3) — `fonts/` directory check must be explicit here; responsive variant inflation (Pitfall 5) — group by base name at manifest build time
**Research flag:** Standard patterns — bulk `cp -r` pattern and base64 write pattern are fully documented.

### Phase 4: HTML Parsing and Site Analysis
**Rationale:** Depends on extracted files from Phase 2. This is the most complex domain logic — Webflow-specific class detection, CMS template identification, shared layout extraction, and per-page structural breakdown all live here.
**Delivers:** `layout/parse.ts`, `layout/webflow.ts`, `layout/shared.ts`, `layout/routes.ts`, `pages/analyze.ts` — typed `ParsedPage[]`, `SiteLayout`, `RouteMap`, and `PageAnalysis[]`.
**Addresses:** Page discovery, Webflow component pattern recognition, shared layout detection, CMS limitation disclosure, page structural breakdown per page
**Avoids:** CMS template misidentification (Pitfall 2) — detect `detail_*.html` and `{{wf ...}}` here; OG meta absolute URL detection; form backend annotation
**Research flag:** Needs careful implementation — the Webflow class registry (`w-nav`, `w-dropdown`, `w-slider`, `w-tabs`, `w-form`, `w-lightbox`, `w-embed`) must be explicit. No additional phase research needed; STACK.md and PITFALLS.md provide the full class list and detection heuristics.

### Phase 5: Brief Generation
**Rationale:** Pure function that consumes all structured data from Phases 2-4. Last to be built in the domain layer — depends on all upstream data structures being finalized. Most critical for product quality.
**Delivers:** `brief/generate.ts`, `brief/sections.ts`, `brief/io.ts` — mode-aware `brief.md` with Planning Document + Session Tracker structure, interactive component inventory, typography section, asset manifest, CSS reference, and mode-specific behavioral instructions.
**Addresses:** `brief.md` output, mode differentiation (Pixel Perfect vs Best Site), multi-session scaffold, interactive component documentation, token estimation
**Avoids:** Mode instructions absent (Pitfall 6) — Pixel Perfect and Best Site must have different behavioral directives in the brief body, not just a label; IX2 interactions missing (Pitfall 1) — every `.w-nav`, `.w-slider`, `.w-tab` must appear in "Interactive Components Requiring Rebuild"; multi-session collapse (Pitfall 4) — two-tier brief structure; markdown injection (Pitfall 8) — sanitize all Webflow-derived strings, unit test with adversarial inputs
**Research flag:** Needs deliberate design of the brief template before coding. The brief structure (sections, mode instructions, session tracker format) should be drafted and reviewed before `generate.ts` is written.

### Phase 6: Full UI Wiring and Polish
**Rationale:** With all domain modules complete and tested, this phase connects everything into the full extraction pipeline with production-quality UX.
**Delivers:** `views/MainView.tsx`, `components/ModeSelector.tsx`, `components/ProgressBar.tsx`, `components/ResultsPanel.tsx` — the complete working plugin with named progress steps, error states, results display, and copy-to-clipboard.
**Addresses:** Mode selection UI, progress feedback, error handling UX, results display, `storage` API for persisting last-used mode/zip path
**Avoids:** UX pitfalls — processing spinner with no detail (use named steps), mode selection after extraction (mode must be locked before pipeline starts), brief path not visible in Done view
**Research flag:** Standard patterns — Figma plugin's UI patterns are a complete reference.

### Phase 7: v1.x Enhancements
**Rationale:** After v1 validates the core brief generation concept, add the P2 features that address common agent failure modes.
**Delivers:** Shared layout detection, JavaScript interaction inventory, CMS disclosure refinements, responsive image grouping improvements, token estimation in results UI
**Addresses:** P2 features from FEATURES.md
**Research flag:** Standard patterns for most; interaction inventory detection patterns are documented in PITFALLS.md.

### Phase Ordering Rationale

- Phases 2-4 follow the data dependency chain strictly: extraction must precede parsing, parsing must precede brief generation
- Asset copying (Phase 3) is ordered before HTML parsing (Phase 4) because it only needs `ZipContents`, not parsed HTML — building it earlier validates the `.shipstudio/assets/` path convention before brief generation depends on it
- Brief generation (Phase 5) is isolated as its own phase because it is the product's core deliverable and requires deliberate template design before coding — it should not be implemented alongside the data extraction phases
- UI wiring (Phase 6) is deferred until domain modules are complete so it can be integrated with real data rather than mocked

### Research Flags

Phases needing careful deliberate design before coding:
- **Phase 5 (Brief Generation):** The brief template — section structure, mode-specific instruction text, Session Tracker format, and interactive component inventory format — should be drafted as a document before `brief/generate.ts` is coded. The brief is the product; getting this wrong requires regenerating all user output.

Phases with well-documented standard patterns (implementation straightforward):
- **Phase 1:** Plugin-starter provides complete scaffold; Figma plugin confirms the pattern
- **Phase 2:** Shell.exec unzip pattern fully documented in STACK.md with exact command signatures
- **Phase 3:** Bulk `cp -r` and base64 write patterns fully documented; responsive variant grouping heuristic is clear (`-p-[0-9]+` suffix detection)
- **Phase 6:** Figma plugin's `views/MainView.tsx` and component patterns are a direct reference

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions sourced from direct inspection of plugin-starter, plugin-figma, and the actual Webflow zip. No external library uncertainty — zero runtime deps. |
| Features | HIGH | MVP is well-defined from PROJECT.md requirements + Figma plugin precedent + direct Webflow zip inspection. P2/P3 features are clearly delineated. |
| Architecture | HIGH | Figma plugin is a near-identical reference implementation. Data flow, module boundaries, and build order are all validated patterns. |
| Pitfalls | HIGH | Most pitfalls sourced from direct zip inspection and confirmed by multiple community sources. The CMS template, IX2, and multi-session pitfalls are all confirmed real-world failure modes. |

**Overall confidence:** HIGH

### Gaps to Address

- **File picker path access pattern:** STACK.md flags that `input[type=file]` behavior in Ship Studio's Electron/Tauri context may differ from standard browser behavior. The Figma plugin's base64+shell.exec pattern is the safe fallback but the exact mechanism for getting a filesystem path from the file input needs verification at the start of Phase 2 implementation.

- **Brief template design:** The brief structure (exact section order, Session Tracker format, mode-specific instruction text) is not finalized. This is a deliberate gap — it should be designed as a document before Phase 5 coding begins. The quality of the brief is the quality of the product.

- **Unicode filename handling:** PITFALLS.md notes that `unzip` on macOS may fail on non-ASCII filenames. The `unzip -O UTF-8` flag behavior has not been verified. This is a low-probability issue for initial users but should be tested before general release.

- **Large site brief size:** The threshold at which a per-page breakdown becomes too verbose for agent context windows (~20+ pages suggested) has not been empirically measured. Token estimation (P2 feature) will surface this in production.

---

## Sources

### Primary (HIGH confidence)
- `plugin-starter/CLAUDE.md` — Authoritative Ship Studio plugin development guide
- `plugin-starter/vite.config.ts` — Canonical Vite config with React externalization pattern
- `plugin-figma/src/` — Complete reference implementation (brief generation, asset handling, UI patterns)
- `moneystack-website.webflow.zip` — Actual Webflow export; validated zip structure, HTML attributes, asset naming, video sizing
- `plugin-figma/src/brief/io.ts` — Base64 shell write pattern
- `PROJECT.md` — Plugin requirements and mode definitions
- Webflow Help: Responsive Images — Official confirmation of 7-variant naming system
- Webflow Help: Custom Code Embed — Confirms jQuery 3.5.1 + IX2 bundled in webflow.js
- Anthropic: Effective context engineering for AI agents — Multi-session brief structure rationale

### Secondary (MEDIUM confidence)
- Webflow Forum: Interactions/Animations not working in exported code — Community confirmation IX2 does not survive export
- BrowserCat: Migrate Your Webflow Site to Next.js — Practical migration patterns, CMS strip confirmation
- BrowserCat: Migrate Your Webflow Site to Raw Code — CSS structure, monolithic webflow.css
- Webflow Forum: Custom fonts missing when exporting code — Known custom font export issue
- Webflow Wishlist: Code export yields incorrect link to OG images — OG meta absolute URL breakage confirmed
- DEV.to: NoCodeExport IX2 architecture — IX2 as self-contained module
- css.timothyricks.com/webflow-classes — Webflow class reference

### Tertiary (LOW confidence)
- DEV.to: Pixel-perfect designs versus AI — Informative context on pixel vs semantic tradeoffs; single source

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
