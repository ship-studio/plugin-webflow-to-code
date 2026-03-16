# Phase 4: Site Analysis - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Parse every HTML page from the extracted Webflow export. Produce structured data: page list with routes, per-page structural breakdowns (sections, component inventory), Webflow component recognition with migration notes, shared layout detection (common nav/footer), and CMS template page flagging. This is pure analysis — no brief generation (Phase 5) or UI changes beyond wiring the analysis step into the pipeline.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation decisions for this phase are at Claude's discretion:

- **Section detection**: How to identify major page sections (nav, hero, features, footer, etc.) from Webflow HTML. Could use semantic elements, Webflow section classes, DOM depth heuristics, or a combination. Decide the right depth of breakdown.
- **Webflow component mapping**: What migration notes each `.w-*` component gets. How detailed the semantic description and replacement guidance should be (e.g., `.w-nav` → "Navigation bar with Webflow JS interactions — replace with semantic `<nav>` + mobile hamburger JS").
- **Shared layout detection**: How to compare nav/footer across pages — exact HTML string match, normalized comparison, or structural similarity. What threshold makes two elements "the same."
- **CMS template detection**: How to identify CMS pages — `detail_*.html` naming convention, `{{wf ...}}` placeholder scanning, empty body content, or a combination.
- **Data structure design**: The shape of the analysis output (PageInfo, SectionBreakdown, ComponentInventory, etc.) — must be consumable by the brief generator in Phase 5.
- **HTML parsing approach**: DOMParser (browser API available in Ship Studio's WebView) vs regex vs shell.exec with grep/sed. Research should investigate the best approach.

### Locked Decisions (from prior phases)
- All pages included, no filtering
- CSS referenced by path, not re-extracted as tokens
- All file ops through shell.exec
- Webflow validation already done in Phase 2 (data-wf-site confirmed)
- `src/analysis/` directory pre-created

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Implementation
- `src/zip/types.ts` — ZipManifest, ZipStep types (analysis step needs to be added)
- `src/zip/discover.ts` — parseUnzipManifest produces entries[] with all filenames
- `src/assets/types.ts` — AssetManifest type (analysis may need to populate referencingPages)
- `src/assets/manifest.ts` — buildManifest (analysis can feed page references back)
- `src/views/MainView.tsx` — Current pipeline (needs analysis step wired in)
- `src/analysis/` — Pre-created directory with .gitkeep

### Webflow Export Structure
- `moneystack-website.webflow.zip` — Sample with 25 HTML pages, Webflow classes, CMS templates (detail_*.html)
- `.planning/research/PITFALLS.md` — IX2 interactions, CMS template traps, responsive variant handling

### Sibling Plugin Patterns
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/layout/normalize.ts` — Figma plugin's tree normalization (analogous pattern)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/brief/generate.ts` — How analysis data feeds into brief generation

### Research
- `.planning/research/ARCHITECTURE.md` — Component boundaries for analysis module
- `.planning/research/FEATURES.md` — Webflow component semantic mapping as differentiator

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ZipManifest.entries[]` — full file list, can filter for .html files
- `shell.exec('bash', ['-c', ...])` for reading HTML file contents
- `AssetManifest` type has `referencingPages: string[]` fields ready to be populated
- DOMParser available in Ship Studio's WebView context (browser API)
- vitest already configured for unit testing

### Established Patterns
- Pure function pattern: analysis functions should take HTML content string → return typed data
- Shell.exec for file reading: `shell.exec('cat', [filePath])` or base64 encoding for special chars
- TDD pattern established in Phases 2-3 with mock Shell
- ZipStep state machine in MainView — needs 'analyzing' step

### Integration Points
- MainView pipeline: after 'copying' step, before 'done'
- Analysis output feeds into brief generation (Phase 5)
- AssetManifest.referencingPages can be populated during analysis
- ZipStep needs 'analyzing' variant

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key outcomes are:
1. Every HTML page discovered with title, route, filename
2. Per-page structural breakdown with major sections identified
3. Webflow .w-* classes mapped to semantic descriptions with migration guidance
4. Shared nav/footer patterns detected across pages
5. CMS template pages flagged and not treated as real content

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-site-analysis*
*Context gathered: 2026-03-16*
