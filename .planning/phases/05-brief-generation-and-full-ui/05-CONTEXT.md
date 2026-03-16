# Phase 5: Brief Generation and Full UI - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate the mode-aware `brief.md` from all the data collected in Phases 2-4 (ZipManifest, AssetManifest, SiteAnalysis) and wire the complete end-to-end UI — mode selector locked during pipeline, brief written to `.shipstudio/assets/`, results panel showing file path and token count. This is the final phase — after this, the plugin is complete.

</domain>

<decisions>
## Implementation Decisions

### Brief Content
- **Comprehensive coverage**: Every page gets full coverage in the brief. For a 25-page site, the brief may be 10K+ tokens — that's fine. The agent needs everything.
- **Two-tier scaffold**: Planning Document (comprehensive site overview) + Session Tracker (agent-maintained checklist with resume instructions for multi-session migration)
- The brief documents: assets with paths, CSS file references, per-page structural breakdowns, Webflow component migration notes, shared layout patterns, CMS template warnings

### Mode Instructions
- Claude's discretion on the exact tone — may vary by mode (e.g., more directive for Pixel Perfect, more collaborative for Best Site)
- Pixel Perfect: preserve class names, fixed units, exact dimensions, match Webflow layout precisely
- Best Site: semantic HTML, responsive patterns, modern conventions, clean production code

### Results UI
- Claude's discretion on the results panel design
- Must show: brief.md file path and approximate token count
- May include: copy button, preview, open-in-editor, or other UX enhancements

### Claude's Discretion
- Brief section order and structure
- Exact tone and phrasing of mode-specific instructions
- How the Session Tracker format works (checklist structure, resume instructions)
- Results panel features beyond path + token count
- Whether mode selector gets locked/disabled during pipeline execution
- How brief.md is written to disk (base64 encoding pattern from Figma plugin or direct write)

### Locked Decisions (from prior phases)
- Two modes: Pixel Perfect / Best Site (mode cards already in MainView)
- Agent-agnostic markdown output
- Brief written to `.shipstudio/assets/brief.md`
- All file ops through shell.exec
- Multi-session migration design required
- Mode selection happens before extraction (already implemented)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Implementation (Phases 1-4 output)
- `src/zip/types.ts` — ZipStep union (pipeline states), ZipManifest
- `src/assets/types.ts` — AssetManifest, ImageEntry, VideoEntry, FontEntry
- `src/assets/manifest.ts` — buildManifest (produces AssetManifest from entries)
- `src/analysis/types.ts` — SiteAnalysis, PageInfo, SectionItem, ComponentEntry, SharedLayout
- `src/analysis/analyze.ts` — buildSiteAnalysis (produces SiteAnalysis from HTML files)
- `src/views/MainView.tsx` — Current pipeline (extract → validate → copy → analyze → done)
- `src/styles.ts` — Plugin CSS (add results panel styles here)
- `src/brief/` — Pre-created directory with .gitkeep

### Sibling Plugin Patterns
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/brief/generate.ts` — Figma plugin's brief generator (pure function, markdown assembly, mode-specific instructions)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/brief/io.ts` — Brief I/O: base64 encoding for shell.exec write, clipboard copy
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/components/ResultsModal.tsx` — Results display with copy button and stats

### Research
- `.planning/research/ARCHITECTURE.md` — Brief as pure function pattern
- `.planning/research/FEATURES.md` — Multi-session scaffold, token estimation
- `.planning/research/PITFALLS.md` — Brief size exceeding agent context windows

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AssetManifest` — complete asset inventory with grouped variants, paths, purposes
- `SiteAnalysis` — full site data: pages, sections, components, shared layouts, CMS flags
- `ZipStep.done` already carries `assetManifest` and `siteAnalysis`
- MainView already has mode state (`'pixel-perfect' | 'best-site'`)
- Figma plugin's `generate.ts` pattern: pure function taking typed data → returning markdown string
- Figma plugin's `io.ts` pattern: base64 encode markdown → shell.exec write to avoid metacharacter issues

### Established Patterns
- Pure function for generation (no side effects, no shell calls)
- Base64 write for file output: `shell.exec('bash', ['-c', \`echo '${btoa(content)}' | base64 -d > '${path}'\`])`
- `wf2c-` CSS prefix for new styles
- `btn-primary` host class for buttons
- vitest with jsdom environment for DOMParser tests

### Integration Points
- MainView pipeline: after 'analyzing', add 'generating' step, then results UI replaces 'done'
- ZipStep needs 'generating' variant
- Brief output path: `${projectPath}/.shipstudio/assets/brief.md`
- Token estimation: `content.length / 4` as rough approximation

</code_context>

<specifics>
## Specific Ideas

- The brief IS the product — it must be comprehensive enough that a coding agent can recreate the site
- Every page gets full coverage (not just a summary)
- Token count shown in results so users know if they need multi-session planning
- The Figma plugin's brief generator is the direct reference implementation for the pattern

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-brief-generation-and-full-ui*
*Context gathered: 2026-03-16*
