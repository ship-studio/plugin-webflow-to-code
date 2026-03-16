# Phase 5: Brief Generation and Full UI - Research

**Researched:** 2026-03-16
**Domain:** Brief generator (pure function markdown assembly), mode-aware instructions, multi-session scaffold, results UI, base64 file write
**Confidence:** HIGH — all findings based on direct inspection of sibling plugin source, existing codebase types, and prior research documents

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two modes: Pixel Perfect / Best Site (mode cards already in MainView)
- Agent-agnostic markdown output
- Brief written to `.shipstudio/assets/brief.md`
- All file ops through shell.exec
- Multi-session migration design required
- Mode selection happens before extraction (already implemented)
- Comprehensive coverage: Every page gets full coverage. For a 25-page site the brief may be 10K+ tokens — that's fine. The agent needs everything.
- Two-tier scaffold: Planning Document (comprehensive site overview) + Session Tracker (agent-maintained checklist with resume instructions for multi-session migration)
- Brief documents: assets with paths, CSS file references, per-page structural breakdowns, Webflow component migration notes, shared layout patterns, CMS template warnings

### Claude's Discretion
- Brief section order and structure
- Exact tone and phrasing of mode-specific instructions
- How the Session Tracker format works (checklist structure, resume instructions)
- Results panel features beyond path + token count
- Whether mode selector gets locked/disabled during pipeline execution
- How brief.md is written to disk (base64 encoding pattern from Figma plugin or direct write)
- Claude's discretion on the exact tone — may vary by mode (e.g., more directive for Pixel Perfect, more collaborative for Best Site)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BREF-01 | User selects between "Pixel Perfect" and "Best Site" modes before extraction via radio cards in the modal | Mode cards already exist in MainView; mode state already `'pixel-perfect' \| 'best-site'`; mode must be locked (hidden) during pipeline execution — showModeSelector already computed from step.kind |
| BREF-02 | Brief contains mode-specific behavioral instructions (Pixel Perfect: exact dimensions, fixed units; Best Site: semantic HTML, responsive patterns) | `buildInstructionsSection(mode)` pattern from Figma plugin; instructions must appear in body throughout, not just a header label |
| BREF-03 | Brief includes a multi-session migration scaffold (ordered page list, progress tracking format, resume instructions) | Two-tier structure: Planning Document + Session Tracker section; Session Tracker is a checklist the agent updates after each work session |
| BREF-04 | Plugin shows approximate token count in the results UI after brief generation | `estimateTokens(markdown) = Math.ceil(markdown.length / 4)`; displayed in results panel with warning threshold; also show brief file path |
</phase_requirements>

---

## Summary

Phase 5 is the final phase — it wires everything together. The three upstream data structures (`AssetManifest`, `SiteAnalysis`, and `mode`) are fully materialized by the time `step.kind === 'done'` in MainView. This phase adds: a `generating` step between `done` and a new `results` state, a pure `generateBrief()` function in `src/brief/generate.ts`, a `saveBrief()` I/O helper in `src/brief/io.ts`, and a results panel UI that replaces the current `wf2c-progress-done` div.

The Figma sibling plugin (`plugin-figma/src/brief/`) is the direct reference implementation for the pure-function pattern, base64 write pattern, and results display pattern. The Webflow version follows the same architecture but with a completely different data model: instead of Figma nodes/tokens/design systems, it works from `SiteAnalysis` (pages, sections, Webflow components) and `AssetManifest` (images, videos, fonts, CSS files).

**Primary recommendation:** Implement `generateBrief()` as a pure synchronous function with eight section builders, use `btoa(unescape(encodeURIComponent(markdown)))` for safe file write, and replace the existing `step.kind === 'done'` UI block with a results panel showing file path, token count, and a "Copy to Clipboard" button.

---

## Standard Stack

### Core (Already in Project)
| Library | Purpose | Status |
|---------|---------|--------|
| React (externalized) | UI component rendering | Already used throughout |
| TypeScript | Type-safe function signatures for BriefInput/BriefResult | Already used |
| vitest | Unit tests for pure generate function | Already used in src/analysis/*.test.ts |

### No New Dependencies
All brief generation capabilities are achievable with:
- Pure string manipulation (template literals, Array.join)
- Native `btoa()` / `encodeURIComponent()` for base64 encoding
- Existing `shell.exec` for file write and clipboard copy

**Installation:** None required.

---

## Architecture Patterns

### Recommended File Structure for src/brief/

```
src/brief/
├── generate.ts     # Pure function: BriefInput → BriefResult (markdown string + stats)
├── io.ts           # saveBrief() via base64 shell.exec; copyToClipboard() via pbcopy
└── types.ts        # BriefInput, BriefResult, BriefStats interfaces
```

The `src/brief/` directory already exists with a `.gitkeep`. These three files are all that is needed.

### Pattern 1: Pure Brief Generator (from Figma plugin)

**What:** `generate.ts` is a synchronous pure function. It receives typed data and returns a markdown string. Zero shell calls, zero async, zero side effects.

**When to use:** Always for brief assembly. Keeps the core logic unit-testable with mock data.

**Signature:**
```typescript
// src/brief/types.ts
export type BriefMode = 'pixel-perfect' | 'best-site';

export interface BriefInput {
  mode: BriefMode;
  siteAnalysis: SiteAnalysis;
  assetManifest: AssetManifest;
  projectPath: string;
  date?: string;  // ISO date string, defaults to new Date().toISOString().slice(0, 10)
}

export interface BriefStats {
  pageCount: number;
  contentPageCount: number;
  cmsTemplateCount: number;
  assetCount: number;
  estimatedTokens: number;
}

export interface BriefResult {
  markdown: string;
  charCount: number;
  estimatedTokens: number;
  stats: BriefStats;
}
```

**Implementation:**
```typescript
// src/brief/generate.ts
export function estimateTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}

export function generateBrief(input: BriefInput): BriefResult {
  const sections = [
    buildMetadataSection(input),
    buildInstructionsSection(input.mode),
    buildOverviewSection(input.siteAnalysis),
    buildSharedLayoutSection(input.siteAnalysis.sharedLayout),
    buildCSSReferenceSection(input.assetManifest.cssFiles),
    buildPagesSection(input.siteAnalysis.pages, input.mode),
    buildAssetsSection(input.assetManifest),
    buildSessionTrackerSection(input.siteAnalysis.pages),
  ].filter(Boolean);

  const markdown = sections.join('\n\n');
  return {
    markdown,
    charCount: markdown.length,
    estimatedTokens: estimateTokens(markdown),
    stats: { /* computed from inputs */ },
  };
}
```

### Pattern 2: Base64 File Write (from Figma plugin io.ts — HIGH confidence)

**What:** Encode markdown as base64 before passing to shell.exec to avoid all shell metacharacter corruption. Markdown content contains backticks, dollar signs, pipes, angle brackets — unescaped echo breaks every time.

**Exact pattern from `plugin-figma/src/brief/io.ts`:**
```typescript
// src/brief/io.ts
export async function saveBrief(
  shell: Shell,
  projectPath: string,
  markdown: string,
): Promise<void> {
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  // btoa only handles Latin1; encodeURIComponent + unescape bridges UTF-8
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', [
    '-c',
    `echo '${encoded}' | base64 -d > '${briefPath}'`,
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save brief: ${result.stderr}`);
  }
}

export async function copyToClipboard(
  shell: Shell,
  markdown: string,
): Promise<void> {
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', [
    '-c',
    `echo '${encoded}' | base64 -d | pbcopy`,
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Clipboard copy failed: ${result.stderr}`);
  }
}
```

### Pattern 3: ZipStep Extension for 'generating'

**What:** Add `'generating'` variant to the `ZipStep` union so the pipeline has discrete UI feedback during brief generation.

**Change to `src/zip/types.ts`:**
```typescript
export type ZipStep =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'copying'; label: string }
  | { kind: 'analyzing'; pageCount: number }
  | { kind: 'generating' }          // NEW
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number; assetManifest?: AssetManifest; siteAnalysis?: SiteAnalysis; briefResult?: BriefResult }  // briefResult added
  | { kind: 'error'; message: string };
```

### Pattern 4: MainView Pipeline Extension

**What:** After `buildSiteAnalysis` completes, add two more steps: set `generating`, call `generateBrief()` + `saveBrief()`, then set `done` with `briefResult` attached.

**Integration in MainView.tsx:**
```typescript
// Step 6: Generate brief
setStep({ kind: 'generating' });
let briefResult: BriefResult;
try {
  briefResult = generateBrief({ mode, siteAnalysis, assetManifest, projectPath });
  await saveBrief(shell, projectPath, briefResult.markdown);
} catch (err: any) {
  setStep({ kind: 'error', message: err?.message || 'Brief generation failed' });
  return;
}

// Step 7: Done with all results
setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount, assetManifest, siteAnalysis, briefResult });
```

### Pattern 5: Results Panel (replacing current done block)

**What:** The current `step.kind === 'done'` block shows a single `wf2c-progress-done` line. This phase replaces it with a proper results panel component.

**Reference:** `plugin-figma/src/components/ResultsModal.tsx` — shows success header, copy button, stats row, expandable details, file path footer, "Get New Brief" button.

**Webflow-adapted approach (simpler, inline in MainView):**
```tsx
{step.kind === 'done' && step.briefResult && (
  <div className="wf2c-results">
    <div className="wf2c-results-success">Brief ready</div>
    <button className="btn-primary" onClick={handleCopyBrief} style={{ width: '100%' }}>
      Copy Brief to Clipboard
    </button>
    <div className="wf2c-results-stats">
      {step.siteAnalysis?.contentPageCount} pages &middot;{' '}
      {step.assetManifest && (step.assetManifest.images.length + step.assetManifest.videos.length + step.assetManifest.fonts.length)} assets &middot;{' '}
      <span>~{Math.round(step.briefResult.estimatedTokens / 1000)}K tokens</span>
    </div>
    <div className="wf2c-results-path">.shipstudio/assets/brief.md</div>
    <button className="btn-secondary" onClick={handleRetry} style={{ width: '100%', marginTop: '8px' }}>
      Start Over
    </button>
  </div>
)}
```

### Anti-Patterns to Avoid

- **Mode as a label only:** Brief must have mode-specific directives throughout the body — not just `**Mode:** Pixel Perfect` in a metadata header. The instruction section must be substantially different between modes.
- **No Session Tracker:** Brief must include the two-tier structure. A flat list of pages with no progress mechanism collapses for multi-session migrations.
- **Raw string interpolation into table cells:** Page titles and class names from Webflow HTML must have pipe characters escaped (`|` → `\|`) before use in markdown tables. Wrap class names in backticks.
- **echo without base64:** Never use `echo "${markdown}"` in shell.exec. Always base64-encode first.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token estimation | Custom NLP token counter | `Math.ceil(markdown.length / 4)` | This is the standard rough estimate used by the Figma plugin and widely accepted; exact tokenization not needed |
| UTF-8 safe base64 | Custom encoding | `btoa(unescape(encodeURIComponent(content)))` | Proven pattern from Figma plugin io.ts; handles all UTF-8 characters including smart quotes from Webflow page titles |
| Clipboard write | Custom clipboard API | `echo '${encoded}' \| base64 -d \| pbcopy` via shell.exec | macOS pbcopy is the established pattern from Figma plugin; Ship Studio context does not expose navigator.clipboard |
| Markdown escaping | Custom regex escaper | Inline pipe escape + backtick wrapping | Full markdown escaping is overkill; only pipe in table cells and raw class names need treatment |

**Key insight:** The brief generator is a string assembly problem. The complexity is in the design of the template (section order, mode-specific instructions, Session Tracker structure) — not in the implementation machinery.

---

## Common Pitfalls

### Pitfall 1: Mode Distinction Collapses
**What goes wrong:** Both modes produce briefs that differ only in a header line. The agent ignores the label and does whatever it would do anyway.
**Root cause:** `buildInstructionsSection` has one code path with a conditional label append rather than two distinct instruction blocks.
**Prevention:** The instructions section must use separate text blocks per mode. Pixel Perfect: "Preserve all Webflow class names exactly. Copy normalize.css, webflow.css, and the site CSS into the project in that order. Use exact pixel values from the HTML layout. Do not rename `.w-nav` to `<nav>`." Best Site: "You may replace Webflow class names with semantic HTML. Replace `.w-nav` with `<nav>`, `.w-button` with `<button>`. Use semantic HTML5 elements. Implement responsive patterns with CSS grid/flexbox and relative units."
**Warning signs:** The `if (mode === 'pixel-perfect')` branch returns only a short label difference from the `else` branch.

### Pitfall 2: Multi-Session Structure Absent
**What goes wrong:** Brief is a flat document. Large sites (15+ pages) exceed agent context on first load. In session two, the agent has no structured record of what was completed.
**Root cause:** Session Tracker section not included; brief designed to be read linearly, not resumed.
**Prevention:** Session Tracker must be a concrete markdown checklist with one checkbox per page: `- [ ] index.html — Home`. Include explicit resume instructions: "At the start of each session, read the Session Tracker to identify the next unchecked page. Update the tracker before ending each session."
**Warning signs:** Brief has no `## Session Tracker` section or no per-page checkboxes.

### Pitfall 3: Markdown Injection from Webflow Content
**What goes wrong:** Page titles like "Pricing | 50% Off — Black Friday" break markdown tables. Class names with backticks corrupt code fences.
**Root cause:** Webflow-derived strings interpolated directly into table rows without escaping.
**Prevention:** Escape pipes in table cells. Wrap class name lists in backticks or code fences. Unit test with adversarial inputs.
**Warning signs:** No escaping logic; unit tests only use clean ASCII titles.

### Pitfall 4: brief.md Path Confusion
**What goes wrong:** Brief written to wrong location, or results panel shows absolute machine path instead of project-relative path.
**Root cause:** Using `projectPath + '/.shipstudio/assets/brief.md'` for shell write (correct) but same string in UI (exposes user's absolute path).
**Prevention:** Shell write uses `projectPath` for the actual write; UI displays only `.shipstudio/assets/brief.md` (project-relative).

### Pitfall 5: Token Count Showing 0 or NaN
**What goes wrong:** Results panel shows `~0K tokens` or `~NaN tokens`.
**Root cause:** `estimatedTokens` computed before markdown is assembled, or division before string length is available.
**Prevention:** `estimateTokens()` called on the final assembled markdown string immediately after `sections.join('\n\n')`. The value flows through `BriefResult` to the UI.

---

## Brief Template Design

This is the central design artifact of Phase 5. The section order and content spec below is the authoritative template.

### Locked Section Order

```
1. # Webflow Migration Brief    ← Metadata: site name, date, mode, page/asset counts
2. ## How to Use This Brief     ← Mode-specific behavioral directives (DIFFERENT per mode)
3. ## Site Overview             ← High-level: page count, CMS template count, component inventory
4. ## Shared Layout             ← Nav/footer: build once as shared component (if detected)
5. ## CSS Reference             ← Paths to all CSS files in .shipstudio/assets/css/
6. ## Pages                     ← Per-page breakdown (one ### subsection per page)
7. ## Assets                    ← Asset manifest table (images, videos, fonts)
8. ## Session Tracker           ← Migration progress checklist; agent maintains this
```

Empty sections are omitted entirely (e.g., no Shared Layout section if `sharedLayout.hasSharedNav === false && sharedLayout.hasSharedFooter === false`; no Assets section if `assetManifest.totalCopied === 0`).

### Section 1: Metadata

```markdown
# Webflow Migration Brief

**Site:** {siteName derived from first CSS filename or zip filename}
**Extracted:** {YYYY-MM-DD}
**Mode:** {Pixel Perfect | Best Site}
**Pages:** {contentPageCount} content pages{, cmsTemplateCount CMS templates if > 0}
**Assets:** {totalCopied} files copied to .shipstudio/assets/
**Estimated tokens:** ~{N}K
```

### Section 2: Mode-Specific Instructions (CRITICAL — must differ substantially per mode)

**Pixel Perfect mode:**
```markdown
## How to Use This Brief

**Goal:** Reproduce the Webflow site with maximum visual fidelity. The output should be indistinguishable from the original when viewed in a browser.

**Before building:** Read the full Pages section for the page you are migrating. Study the section structure and Webflow components list. Review the CSS Reference section — the original styles are in these files.

**During building:**
- Preserve all Webflow class names exactly as they appear. Do not rename `.w-nav` to `nav`, `.w-button` to `button`, or any other class.
- Copy normalize.css, webflow.css, and the site CSS file (in that order) into your project and import them. These contain all the layout and visual styles.
- Use the exact pixel values and fixed units from the original HTML structure.
- Every Webflow component (`.w-nav`, `.w-slider`, `.w-tabs`, etc.) must be replaced with a native implementation — see the migration note in each component's entry. Do NOT use webflow.js.
- Build shared nav and footer as components (see Shared Layout section) and reuse them across all pages.

**After building:** Compare your output against the original Webflow export visually. Spacing, color, and typography should match the CSS file values.
```

**Best Site mode:**
```markdown
## How to Use This Brief

**Goal:** Rebuild the site using modern, semantic, maintainable code. Capture the visual design and content while improving the code quality.

**Before building:** Read the Site Overview and Shared Layout sections first. Then work through pages one at a time using the Session Tracker.

**During building:**
- Use semantic HTML5 elements: `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Replace Webflow utility classes with your project's preferred approach (Tailwind, CSS Modules, or plain CSS).
- Use CSS grid and flexbox with relative units (rem, %, clamp) for responsive layouts.
- Implement Webflow components as native equivalents: `.w-nav` → `<nav>` with CSS + JS hamburger; `.w-slider` → CSS scroll snap or a lightweight library; `.w-tabs` → `<details>`/`<summary>` or custom JS tabs.
- Do NOT use webflow.js — it is Webflow's proprietary runtime and will not work outside Webflow hosting.
- Reference the CSS files for color values and typography, but adapt the rules to your implementation approach.

**After building:** Verify the visual hierarchy, color palette, and content structure match the original design intent.
```

### Section 3: Site Overview

```markdown
## Site Overview

**Content pages:** {N}
**CMS templates:** {N} (see CMS note in each template's page entry)
**Webflow components found:** {comma-separated list of allWebflowComponents}
**Has IX2 interactions:** {Yes / No — detected from hasIx2Interactions across pages}

> webflow.js and the site JS file are Webflow runtime bundles. Do NOT attempt to use or port them. All interactive components listed above must be replaced with native implementations.
```

### Section 4: Shared Layout

Only rendered when `sharedLayout.hasSharedNav || sharedLayout.hasSharedFooter`.

```markdown
## Shared Layout

{if hasSharedNav}
**Navigation:** The nav component (class: `.{navClassName}`) appears on all content pages. Build it once as a shared component and reuse it. This component uses `.w-nav` — replace with a semantic `<nav>` and native hamburger JS for mobile.
{/if}

{if hasSharedFooter}
**Footer:** The footer component (class: `.{footerClassName}`) appears on all content pages. Build it once as a shared component.
{/if}

Confidence: {high: "Detected via matching data-w-id attributes" | medium: "Detected via matching class names — verify visually"}
```

### Section 5: CSS Reference

```markdown
## CSS Reference

The following CSS files were copied to `.shipstudio/assets/`. Reference them directly rather than re-extracting values.

| File | Purpose |
|------|---------|
| .shipstudio/assets/css/normalize.css | Cross-browser baseline reset |
| .shipstudio/assets/css/webflow.css | Webflow component base styles |
| .shipstudio/assets/css/{site-name}.css | Site-specific styles — primary design reference |

**Pixel Perfect mode:** Import all three files in the order shown above.
**Best Site mode:** Use these files as a visual reference for colors, typography, and spacing values. Adapt to your implementation approach.
```

### Section 6: Pages

One `###` subsection per page. Non-CMS and CMS pages intermixed in discovery order.

**Content page template:**
```markdown
### {title} — `{route}`

**File:** `{filename}`
**Sections:**
{for each SectionItem}
- `<{tag} class="{className}">` — {label}
{/for}

{if webflowComponents.length > 0}
**Webflow Components:**
| Class | Component | Migration Note |
|-------|-----------|----------------|
{for each ComponentEntry}
| `.{wClass}` | {label} | {migration} |
{/for}
{/if}

{if hasIx2Interactions}
**Interactions:** This page uses Webflow IX2 animations (`data-ix` attributes). Replace with CSS transitions, IntersectionObserver scroll triggers, or equivalent native JS.
{/if}
```

**CMS template page template:**
```markdown
### {title} — `{route}` *(CMS Template)*

**File:** `{filename}`
**Status:** CMS template — no content exported. This is a dynamic route template; the actual content lives in Webflow's CMS database and is NOT included in the zip export.
**Action required:** Build the route structure and page layout. Source content from the Webflow CMS API, a headless CMS, or static placeholder content.
```

### Section 7: Assets

```markdown
## Assets

All files copied to `.shipstudio/assets/`.

### Images ({N} unique images)
| File | Type | Purpose | Variants | Path |
|------|------|---------|----------|------|
{for each ImageEntry}
| `{filename}` | {type} | {purpose} | {variants.join(', ') or '—'} | `{path}` |
{/for}

{if videos.length > 0}
### Videos ({N})
| File | Transcodes | Poster | Path |
|------|-----------|--------|------|
{for each VideoEntry}
| `{filename}` | {transcodes.join(', ') or '—'} | {poster or '—'} | `{path}` |
{/for}
{/if}

{if fonts.length > 0}
### Fonts ({N})
| File | Path |
|------|------|
{for each FontEntry}
| `{filename}` | `{path}` |
{/for}
{/if}
```

**Note on images section header text:** For Pixel Perfect mode, add: "Use srcset to serve responsive variants by suffix size (-p-500, -p-800, etc.)". For Best Site mode, add: "Use the largest available variant as the src; implement your own responsive image strategy."

### Section 8: Session Tracker

```markdown
## Session Tracker

This section tracks migration progress across sessions. Update checkboxes as you complete each page.

**Instructions for the agent:**
1. At the start of each session, read this section to find the next unchecked page.
2. Complete that page's migration before moving to the next.
3. Check the box when the page is fully migrated and visually verified.
4. Before ending a session, update this tracker and commit `MIGRATION_LOG.md` with notes on what was completed and any decisions made.

**Build order (shared components first, then pages):**

- [ ] Shared Nav component (see Shared Layout section)
- [ ] Shared Footer component (see Shared Layout section)
{for each non-CMS page}
- [ ] `{route}` — {title} (`{filename}`)
{/for}
{if cmsTemplateCount > 0}
**CMS Templates (after static pages):**
{for each CMS template page}
- [ ] `{route}` — {title} (`{filename}`) *(CMS Template — requires content strategy)*
{/for}
{/if}

**MIGRATION_LOG.md format:**

Create `MIGRATION_LOG.md` in the project root. After each session, append:

```
## Session {date}
**Completed:** {page routes finished this session}
**Decisions:** {any implementation choices made}
**Next:** {which page to start on next session}
```
```

---

## Code Examples

### Estimating tokens
```typescript
// Source: direct inspection of plugin-figma/src/brief/generate.ts
export function estimateTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}
```

### Base64 write to disk
```typescript
// Source: direct inspection of plugin-figma/src/brief/io.ts
const encoded = btoa(unescape(encodeURIComponent(markdown)));
await shell.exec('bash', ['-c', `echo '${encoded}' | base64 -d > '${briefPath}'`]);
```

### Escaping pipe characters for markdown table cells
```typescript
// Prevents table corruption when Webflow page titles contain pipe characters
function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}
```

### Wrapping class names safely in brief text
```typescript
// Prevents backtick and special character issues
function codeSpan(className: string): string {
  return `\`${className.replace(/`/g, "'")}\``;
}
```

### Token warning threshold (from Figma plugin)
```typescript
// Source: plugin-figma/src/brief/generate.ts line 19
export const TOKEN_WARNING_THRESHOLD = 12_000;
```

### CSS filenames from AssetManifest.cssFiles
```typescript
// cssFiles are already project-relative strings like ".shipstudio/assets/css/normalize.css"
// They come directly from buildManifest() in src/assets/manifest.ts
const cssRows = assetManifest.cssFiles.map(path => {
  const filename = path.split('/').pop() ?? path;
  const purpose = filename === 'normalize.css' ? 'Cross-browser baseline reset'
    : filename === 'webflow.css' ? 'Webflow component base styles'
    : 'Site-specific styles — primary design reference';
  return `| \`${path}\` | ${purpose} |`;
});
```

### Identifying shared layout classes from PageInfo
```typescript
// navClassName and footerClassName are available on PageInfo (from Phase 4)
// sharedLayout.hasSharedNav and .navWfId are on SiteAnalysis.sharedLayout
const navPage = siteAnalysis.pages.find(p => p.navClassName);
const navClass = navPage?.navClassName ?? '.w-nav';
const footerPage = siteAnalysis.pages.find(p => p.footerClassName);
const footerClass = footerPage?.footerClassName ?? '.footer';
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Step 6 sets `done` with sparse data | Step 6 sets `generating`, Step 7 sets `done` with `briefResult` | Pipeline has named brief-generation step for UI feedback |
| `done` block shows one-liner progress text | `done` block shows full results panel | Users can see token count, copy to clipboard, path to file |
| No brief generation | `generateBrief()` pure function | Complete |
| No file write | `saveBrief()` via base64 shell.exec | Complete |

**Deprecated/replaced in this phase:**
- The current `wf2c-progress-done` div in `step.kind === 'done'` render path is replaced by a `wf2c-results` panel. The `wf2c-progress-done` CSS class can remain but will not be the primary done state display.

---

## Open Questions

1. **Spinner or static label during 'generating' step?**
   - What we know: `wf2c-progress::before` applies a CSS spinner animation; `wf2c-progress-done::before { content: none }` removes it
   - What's unclear: Brief generation is synchronous and fast (< 100ms); `saveBrief()` is a single shell.exec call. The step may flash too briefly for a spinner to be useful.
   - Recommendation: Use `wf2c-progress` class for the generating label (spinner shows briefly); acceptable.

2. **Where exactly does `BriefResult` type live?**
   - What we know: The Figma plugin puts it in `src/brief/types.ts`; the new `BriefResult` type needs to be importable from both `generate.ts` and `zip/types.ts` (where `ZipStep.done` will reference it)
   - Recommendation: Define in `src/brief/types.ts` and import into `src/zip/types.ts`. This creates a dependency from zip types → brief types; acceptable given the direction of data flow.

3. **Site name for brief title — derive from what?**
   - What we know: `assetManifest.cssFiles` contains paths like `.shipstudio/assets/css/moneystack-website.css`; the site-specific CSS filename encodes the site name
   - What's unclear: What if the CSS has a generic name?
   - Recommendation: Parse the third CSS filename (index 2) as site-specific CSS; strip `.css` and replace hyphens with spaces. Fallback: "Webflow Export".

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest v4.1.0 |
| Config file | vite.config.ts (vitest configured inline) |
| Quick run command | `npx vitest run src/brief/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BREF-01 | Mode selector hidden during pipeline (step.kind not idle/picking/error) | unit | `npx vitest run src/brief/` | ❌ Wave 0 |
| BREF-02 | Pixel Perfect brief contains class-preservation directives | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |
| BREF-02 | Best Site brief contains semantic HTML directives | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |
| BREF-02 | Mode-specific instruction text differs substantially between modes | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |
| BREF-03 | Generated brief contains Session Tracker section | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |
| BREF-03 | Session Tracker has one checkbox per content page | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |
| BREF-03 | Session Tracker has resume instructions | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |
| BREF-04 | estimateTokens returns Math.ceil(markdown.length / 4) | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |
| BREF-04 | BriefResult.estimatedTokens is non-zero for non-empty brief | unit | `npx vitest run src/brief/generate.test.ts` | ❌ Wave 0 |

Additional test coverage (not requirement-mapped but protecting pitfalls):
| Behavior | Test Type | File |
|----------|-----------|------|
| Page title with pipe character does not break markdown table | unit | generate.test.ts |
| CMS template page has "CMS Template" label, not treated as content | unit | generate.test.ts |
| Empty assets section omitted when no assets | unit | generate.test.ts |
| saveBrief calls shell.exec with base64-encoded content | unit | io.test.ts |
| copyToClipboard calls shell.exec with pbcopy | unit | io.test.ts |

### Sampling Rate
- **Per task commit:** `npx vitest run src/brief/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/brief/generate.test.ts` — covers all BREF-02, BREF-03, BREF-04 unit tests plus pitfall guards
- [ ] `src/brief/io.test.ts` — covers saveBrief and copyToClipboard shell.exec call verification
- [ ] `src/brief/types.ts` — BriefInput, BriefResult, BriefStats, BriefMode type definitions (no test, but needed before generate.ts can compile)

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `plugin-figma/src/brief/generate.ts` — pure function pattern, estimateTokens, section builder pattern, TOKEN_WARNING_THRESHOLD = 12_000
- Direct inspection: `plugin-figma/src/brief/io.ts` — base64 write pattern, btoa(unescape(encodeURIComponent())), pbcopy clipboard
- Direct inspection: `plugin-figma/src/components/ResultsModal.tsx` — results panel structure: success header, copy button, stats row, expandable details, file path footer, new brief button
- Direct inspection: `src/zip/types.ts` — current ZipStep union; extension point for 'generating' variant
- Direct inspection: `src/assets/types.ts` — AssetManifest, ImageEntry, VideoEntry, FontEntry shapes
- Direct inspection: `src/assets/manifest.ts` — how cssFiles are structured (project-relative paths)
- Direct inspection: `src/analysis/types.ts` — SiteAnalysis, PageInfo, SectionItem, ComponentEntry, SharedLayout shapes
- Direct inspection: `src/analysis/analyze.ts` — buildSiteAnalysis signature, what it returns
- Direct inspection: `src/views/MainView.tsx` — current pipeline, step state, mode state, showModeSelector logic
- Direct inspection: `src/styles.ts` — existing CSS classes (wf2c-progress, wf2c-progress-done, wf2c-error, btn-primary)
- Direct inspection: `.planning/research/ARCHITECTURE.md` — pure function pattern, base64 anti-pattern documentation
- Direct inspection: `.planning/research/PITFALLS.md` — mode collapse, multi-session, markdown injection, brief size concerns
- Direct inspection: `.planning/research/FEATURES.md` — multi-session scaffold design, token estimation UX

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` cites: [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — agent context window management, CLAUDE.md as persistent context
- `.planning/research/PITFALLS.md` cites: [Webflow Help: Responsive Images](https://help.webflow.com/hc/en-us/articles/33961378697107-Responsive-images) — responsive image variant naming confirmed

---

## Metadata

**Confidence breakdown:**
- Brief template design: HIGH — all inputs are concrete types from Phase 1-4 implementation; section design is based on direct data available
- Mode instructions: HIGH — pattern confirmed in Figma plugin; content is design judgment backed by PITFALLS.md guidance
- File I/O (base64 pattern): HIGH — copied verbatim from Figma plugin io.ts which is production-proven
- ZipStep extension: HIGH — union type pattern is already established; adding one variant is minimal risk
- Results panel: HIGH — Figma plugin ResultsModal.tsx is direct reference; simplified version for Webflow
- Session Tracker format: HIGH — design based on PITFALLS.md multi-session research and CONTEXT.md locked decisions
- Markdown escaping: HIGH — PITFALLS.md documents this as a known pitfall with specific solution

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain — no external dependencies, all findings from internal codebase)
