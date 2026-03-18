# Phase 6: Migration Plan Schema and Brief Integration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Design the migration-plan.json schema, implement skeleton generation from site analysis data, and update the brief to instruct agents to read and maintain the plan file. The plugin writes the initial plan file; the agent updates it as it builds.

</domain>

<decisions>
## Implementation Decisions

### Schema structure
- Hybrid approach: plugin provides a skeleton structure (pages + sections from analysis), agent can add/modify items but must keep the base format
- Items identified by name + type (no IDs needed)
- Two item types: `shared` (nav, footer) and `page` (with nested `children` for sections/components)
- Agent decides build order — pages in the plan can be reordered by the agent based on what makes sense for their framework
- Shared components (nav, footer) are top-level items, not nested under any page

### Schema bootstrapping
- Plugin writes skeleton `migration-plan.json` during brief generation (alongside `brief.md`)
- All pages, sections, shared components pre-filled from SiteAnalysis with status "pending"
- Agent reads the file, adds items if needed (e.g., framework setup tasks), updates status as it builds
- This means the plan file exists immediately — no "waiting for plan" state needed (impacts Phase 8 HAND-02)

### Status granularity
- Three status values: `pending`, `in-progress`, `complete`
- Items also support an optional `notes` field (string) for agent annotations like "responsive done, animations pending"
- Plugin UI can show notes in the expanded per-section view

### Brief instructions
- Full JSON example included in the brief so the agent sees the exact format (~500 tokens, removes ambiguity)
- Instructions go at the top of the Instructions section — "Step 1: Read migration-plan.json. Step 2: Build the site."
- Replaces the existing Session Tracker section (plan file IS the tracker now, single source of truth)
- Brief tells agent: the plan file already exists, read it, update status as you complete each item, add new items if your framework needs them

### Claude's Discretion
- Exact JSON field names and nesting syntax
- Whether to include metadata fields (version, createdAt, etc.)
- How verbose the brief's JSON example should be
- Error handling if plan file is malformed when plugin reads it

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brief generation
- `src/brief/generate.ts` — Main brief generation pipeline, `buildInstructionsSection()` and `buildSessionTrackerSection()` are the key functions to modify
- `src/brief/types.ts` — BriefInput, BriefResult types that may need extension
- `src/brief/io.ts` — saveBrief and copyToClipboard — plan file write will follow same pattern

### Site analysis (data source for skeleton)
- `src/analysis/types.ts` — SiteAnalysis, PageInfo, SectionItem, SharedLayout types that inform plan schema
- `src/views/MainView.tsx` — Pipeline orchestration, will need to call plan file generation after brief generation

### Test coverage
- `src/brief/generate.test.ts` — Existing brief generation tests that must not break
- `src/brief/io.test.ts` — I/O helper tests

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SiteAnalysis` type: already has `pages[]` with `sections[]` and `webflowComponents[]` — maps directly to plan schema children
- `SharedLayout`: has `hasSharedNav`/`hasSharedFooter` — maps to top-level shared items
- `saveBrief()` in `io.ts`: writes files via shell.exec with base64 encoding — reuse for plan file writing
- `buildSessionTrackerSection()`: generates the markdown checklist that will be replaced — reference for page ordering logic

### Established Patterns
- All file I/O goes through `shell.exec` with base64 encoding to avoid metacharacter issues
- Brief generation is a pure function (`generateBrief`) with I/O separated into `saveBrief`/`copyToClipboard`
- Types defined in separate `types.ts` files per module

### Integration Points
- `MainView.tsx` pipeline: plan file generation happens after `generateBrief()` and `saveBrief()`, before setting step to 'done'
- `generateBrief()` return value may need to include plan JSON for the MainView to write it

</code_context>

<specifics>
## Specific Ideas

- The plan file existing immediately (plugin-generated skeleton) is a key UX win — no waiting state, progress view is available as soon as the agent starts working
- The brief should make it crystal clear: "DO NOT create migration-plan.json — it already exists. Read it, then start building."

</specifics>

<deferred>
## Deferred Ideas

- HAND-02 ("Waiting for plan" state) may be unnecessary since plugin writes the skeleton — revisit in Phase 8 planning
- Could add a "Reset Plan" button to regenerate the skeleton if the agent corrupts the file — defer to future

</deferred>

---

*Phase: 06-migration-plan-schema-and-brief-integration*
*Context gathered: 2026-03-18*
