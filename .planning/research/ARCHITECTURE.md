# Architecture Research

**Domain:** Webflow-to-code extraction plugin (Ship Studio)
**Researched:** 2026-03-16
**Confidence:** HIGH — based on direct inspection of the sibling Figma plugin source (proven architecture) and the actual sample Webflow zip

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Ship Studio Host                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Plugin Context (injected via window globals)            │   │
│  │  shell.exec | storage.read/write | actions.showToast     │   │
│  │  project.path | theme.mode                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────┬──────────────────────────────────────────── ┘
                    │ IPC (plugin loaded from dist/index.js)
┌───────────────────▼──────────────────────────────────────────── ┐
│                    Plugin Entry (src/index.tsx)                  │
│  exports: { name, slots: { toolbar }, onActivate, onDeactivate }│
│  Toolbar button → Modal → View Router                           │
└───────────────────┬─────────────────────────────────────────────┘
                    │
       ┌────────────┴────────────────────────────┐
       │                                         │
┌──────▼──────┐                       ┌──────────▼─────────┐
│  SetupView  │                       │    MainView         │
│ (first run) │                       │ (core extraction UI)│
└─────────────┘                       └──────────┬──────────┘
                                                  │
                     ┌────────────────────────────┼──────────────────────────┐
                     │                            │                          │
          ┌──────────▼──────┐        ┌────────────▼────────┐    ┌───────────▼───────┐
          │  src/zip/        │        │  src/layout/         │    │  src/brief/        │
          │  (I/O layer)     │        │  (parsing layer)     │    │  (generation layer)│
          └──────────┬───────┘        └────────────┬─────────┘    └───────────┬───────┘
                     │                             │                          │
          ┌──────────▼───────┐        ┌────────────▼─────────┐               │
          │  src/assets/      │        │  src/pages/           │               │
          │  (copy layer)     │        │  (page analysis)      │               │
          └──────────┬────────┘        └─────────────────────┘               │
                     │                                                        │
                     └────────────────────────────────────────────────────── ┘
                                       produces brief.md + copied assets
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/index.tsx` | Plugin entry, toolbar button, modal, view routing, top-level state | Ship Studio host via `usePluginContext`, all views |
| `src/views/SetupView` | First-run splash or empty state when no zip selected | index.tsx (navigation) |
| `src/views/MainView` | File picker, mode selector, extraction progress, results | all domain modules |
| `src/context.ts` | `usePluginContext()` hook — bridges Ship Studio globals to typed React context | All components that need `shell`, `storage`, `actions` |
| `src/zip/` | Unzip operation, directory listing, file reads via shell.exec | MainView orchestrator, layout, assets |
| `src/layout/` | HTML parsing (cat + regex/cheerio), page discovery, route inference, structural analysis, Webflow class detection | zip module, brief generator |
| `src/pages/` | Per-page breakdown: sections, component patterns, nav/footer detection, shared layout identification | layout module, brief generator |
| `src/assets/` | Copy images/SVGs/videos/fonts to `.shipstudio/assets/`; sanitize filenames; build asset manifest | zip module, brief generator |
| `src/brief/` | Pure function: assemble markdown brief from all extracted data; mode-aware instructions; multi-session framing | MainView (trigger), io.ts (save), all data modules |
| `src/components/` | Reusable UI: Modal, ProgressBar, ModeSelector, ResultsPanel | All views |
| `src/types.ts` | Shared TypeScript interfaces (Shell, Storage, PluginContextValue, extraction types) | All modules |

---

## Recommended Project Structure

```
src/
├── index.tsx              # Entry: toolbar slot, modal, view router, top-level state machine
├── context.ts             # usePluginContext() hook (identical pattern to Figma plugin)
├── types.ts               # Shell, Storage, PluginContextValue, extraction types, brief types
│
├── views/
│   ├── MainView.tsx       # Core UI: file picker, mode selector, progress, results display
│   └── SetupView.tsx      # First-run / no-zip state (optional; can be inline in MainView)
│
├── zip/
│   ├── extract.ts         # shell.exec unzip, list contents, read files
│   ├── discover.ts        # categorise entries (HTML pages, CSS, JS, images, videos, fonts)
│   └── types.ts           # ZipContents, PageEntry, AssetEntry
│
├── layout/
│   ├── parse.ts           # Read HTML files, extract structure (pages, head metadata, body outline)
│   ├── webflow.ts         # Webflow-specific: detect .w-nav/.w-dropdown/.w-embed, data-wf-* attrs
│   ├── shared.ts          # Detect shared layout patterns: nav, footer across pages
│   ├── routes.ts          # Infer URL routes from filenames and Webflow metadata
│   └── types.ts           # ParsedPage, SiteLayout, WebflowClass
│
├── pages/
│   ├── analyze.ts         # Per-page structural breakdown: sections, headings, key components
│   └── types.ts           # PageAnalysis, Section
│
├── assets/
│   ├── copy.ts            # shell.exec cp of images/videos/fonts to .shipstudio/assets/
│   ├── sanitize.ts        # Filename sanitization (strip Webflow hashes/responsive suffixes)
│   ├── manifest.ts        # Build asset manifest: filename, original path, type, responsive variants
│   └── types.ts           # AssetManifestEntry, AssetType
│
├── brief/
│   ├── generate.ts        # Pure function: assembles full brief.md from all data; mode-aware
│   ├── sections.ts        # Individual section builders (metadata, instructions, pages, assets, CSS ref)
│   ├── io.ts              # saveBrief() via shell.exec + base64; copyToClipboard() via pbcopy
│   └── types.ts           # BriefInput, BriefResult, BriefMode, BriefSection
│
└── components/
    ├── Modal.tsx           # Modal wrapper (re-use from Figma plugin or rebuild)
    ├── ModeSelector.tsx    # Pixel Perfect / Best Site card selector
    ├── ProgressBar.tsx     # Step-based extraction progress
    ├── FilePickerButton.tsx# Triggers shell.exec open dialog or uses input[type=file]
    └── ResultsPanel.tsx    # Post-extraction: brief preview, copy, new extraction
```

### Structure Rationale

- **zip/:** All raw I/O is isolated here. Everything that touches shell.exec for reading the zip lives in one place. This makes testing straightforward (inject a mock Shell) and keeps layout/assets/brief pure.
- **layout/:** HTML parsing and Webflow semantic understanding are separated from page-by-page analysis. `webflow.ts` knows Webflow conventions; `parse.ts` is generic HTML traversal.
- **pages/:** Kept separate from `layout/` because layout deals with the site as a whole (shared nav, route map), while pages/ does per-page structural detail for the brief.
- **assets/:** Copy operations, sanitization, and manifest building are distinct concerns within assets/. `sanitize.ts` handles Webflow's responsive image suffixes (-p-500, -p-800) and hash-in-filename patterns.
- **brief/:** Pure transformation — no I/O except via `io.ts`. `generate.ts` consumes typed data structures and emits markdown. Matches the Figma plugin pattern exactly.
- **components/:** Re-usable UI pieces scoped to the plugin. Keep these thin; no extraction logic.

---

## Architectural Patterns

### Pattern 1: Shell-Mediated File I/O

**What:** All filesystem operations go through `shell.exec` (the Ship Studio IPC bridge). No direct `fs`, `fetch`, or native file APIs.

**When to use:** Always, for every file read, unzip, copy, mkdir, cat operation.

**Trade-offs:** Slightly more verbose than direct FS calls, but required by the plugin architecture. Performance is adequate for zip sizes typical of Webflow exports (< 50MB).

**Example:**
```typescript
// Unzip the export
const result = await shell.exec('unzip', ['-o', zipPath, '-d', extractDir]);
if (result.exit_code !== 0) throw new Error(`unzip failed: ${result.stderr}`);

// Read an HTML file (base64 to avoid encoding issues with special chars)
const read = await shell.exec('bash', ['-c', `base64 < '${htmlPath}'`]);
const content = atob(read.stdout.trim());

// Copy assets to .shipstudio/assets/
await shell.exec('cp', ['-r', `${extractDir}/images/.`, assetsDir]);
```

### Pattern 2: Sequential Pipeline with Progress Feedback

**What:** Extraction proceeds as a linear pipeline with discrete steps. Each step updates a progress state that drives the UI. Failures in one step surface warnings rather than aborting the whole pipeline.

**When to use:** Any multi-step operation that might take several seconds (unzip of large sites, copying many video files).

**Trade-offs:** Linear pipelines are easy to reason about. The tradeoff is no parallelism across steps — acceptable here because the bottleneck is shell.exec IPC round trips, not CPU.

**Example:**
```typescript
// Step-based progress state
type ExtractionStep =
  | 'idle'
  | 'unzipping'
  | 'discovering'
  | 'parsing-layout'
  | 'copying-assets'
  | 'generating-brief'
  | 'done';

// In MainView: drive step transitions
setStep('unzipping');
const zipContents = await extractZip(shell, zipPath, tmpDir);

setStep('parsing-layout');
const siteLayout = await parseLayout(shell, zipContents);

setStep('copying-assets');
const assetManifest = await copyAssets(shell, zipContents, projectPath);

setStep('generating-brief');
const brief = generateBrief({ siteLayout, assetManifest, mode, projectPath });

setStep('done');
```

### Pattern 3: Pure Brief Generator

**What:** `brief/generate.ts` is a pure function — synchronous, no side effects, no shell calls. It takes typed data structures and returns a markdown string. Saving to disk is handled separately in `brief/io.ts`.

**When to use:** Always for brief assembly. Keeps the core logic testable without mocking the Shell.

**Trade-offs:** Requires all data to be fully materialized before generation. In practice this is fine — HTML parsing and asset copying must complete first anyway.

**Example:**
```typescript
// generate.ts signature
export function generateBrief(input: BriefInput): BriefResult {
  const sections = [
    buildMetadataSection(input),
    buildInstructionsSection(input.mode),
    buildPagesSection(input.siteLayout),
    buildCSSReferenceSection(input.cssFiles),
    buildAssetsSection(input.assetManifest, input.projectPath),
  ].filter(Boolean);
  return { markdown: sections.join('\n\n'), stats: computeStats(sections) };
}

// io.ts handles saving (uses base64 trick from Figma plugin)
await saveBrief(shell, assetsDir, brief.markdown);
```

### Pattern 4: Mode-Aware Brief Instructions

**What:** The two user modes (Pixel Perfect, Best Site) produce different behavioral instruction sections at the top of the brief, but share the same structural data (pages, assets, CSS reference). The mode only affects the `buildInstructionsSection` builder.

**When to use:** Mode is captured in UI before extraction runs; passed as a string enum through to `generateBrief`.

**Trade-offs:** Clean separation between "what the agent should aim for" (mode) and "what the site contains" (data). No need to branch in the data extraction pipeline.

---

## Data Flow

### Primary Extraction Flow

```
User: selects .zip file + chooses mode
         │
         ▼
MainView: captures zipPath, mode
         │
         ▼
zip/extract.ts
  shell.exec('unzip', ...)          → tmpDir with extracted files
  zip/discover.ts                   → ZipContents { pages[], cssFiles[], images[], videos[], fonts[] }
         │
         ▼
layout/parse.ts                     → ParsedPage[] (title, route, headings, sections, webflow classes)
layout/shared.ts                    → SharedLayout { nav: string, footer: string }
layout/routes.ts                    → RouteMap { filename → route }
         │
         ▼
pages/analyze.ts                    → PageAnalysis[] (per-page structural breakdown for brief)
         │
         ▼
assets/copy.ts
  shell.exec('mkdir', ...)          → .shipstudio/assets/ created
  shell.exec('cp', ...)             → images, SVGs, videos, fonts copied
assets/sanitize.ts                  → filenames sanitized
assets/manifest.ts                  → AssetManifestEntry[] { filename, path, type, source }
         │
         ▼
brief/generate.ts (pure)            → BriefResult { markdown, stats }
         │
         ▼
brief/io.ts
  shell.exec('base64 -d > brief.md')→ .shipstudio/assets/brief.md written
         │
         ▼
MainView: shows ResultsPanel
  Copy brief button → brief/io.ts copyToClipboard()
```

### State Management

```
MainView local state (React useState):
  zipPath: string | null
  mode: 'pixel-perfect' | 'best-site'
  step: ExtractionStep
  warnings: string[]
  briefResult: BriefResult | null
  assetManifest: AssetManifestEntry[] | null

All extraction state is local to MainView.
No global store needed — single pipeline, single session.
Storage API (ctx.storage) used only if persisting last-used mode or zip path across sessions.
```

### Key Data Flows

1. **Zip discovery:** `unzip -l` output is parsed to build `ZipContents` — the manifest of what's in the export. This drives all subsequent steps; no re-scanning needed.

2. **HTML reading:** HTML files are `cat`-ed via shell.exec (with base64 wrapping). Parsing happens in-process using regex or a lightweight HTML parser (no browser DOM). Webflow class/attribute detection is pattern-based.

3. **Asset copying:** Uses shell `cp -r` for bulk directories (images, videos, fonts). No per-file downloads; all assets are local inside the extracted zip directory.

4. **Brief persistence:** Base64 encoding is used when writing the brief through shell.exec to avoid shell metacharacter escaping issues with markdown content (backticks, $, quotes, pipes). This pattern is proven in the Figma plugin.

5. **CSS reference:** The brief does NOT re-parse CSS into tokens. It points the agent at the CSS files directly (`css/normalize.css`, `css/components.css`, `css/[site].css`). The agent reads them natively as part of its context.

---

## Scaling Considerations

This is a local plugin processing user-owned files. "Scaling" means handling large or complex Webflow sites gracefully.

| Concern | Small site (5 pages) | Large site (50+ pages) | Very large site (100+ pages, many videos) |
|---------|---------------------|----------------------|------------------------------------------|
| Unzip time | Instant | 2-5 seconds | 10-30 seconds; show progress |
| HTML parsing | Instant | 1-2 seconds total | Parse pages lazily or batch |
| Asset copy | Instant | 5-15 seconds for video-heavy sites | Show per-step progress; copy images first |
| Brief size | ~10-20KB | ~50-100KB | Risk of very large brief; summarize repeated page patterns |
| Shell.exec round trips | Low (5-10) | Medium (20-50) | High; batch where possible (cp -r over per-file cp) |

### Scaling Priorities

1. **First bottleneck: video copying.** Webflow exports include multiple transcoded variants per video (mp4, webm, poster jpg). A site with 5 videos may have 15-20 files totalling 20+ MB. Use `cp -r videos/ ...` not per-file copies.

2. **Second bottleneck: brief verbosity.** A 50-page site with full per-page structural breakdown can produce a very large brief. Add a page summary mode for sites above a threshold (e.g. > 20 pages): output a site-wide structural overview rather than full per-page breakdowns.

---

## Anti-Patterns

### Anti-Pattern 1: Per-File Shell Exec for Asset Copying

**What people do:** Loop over every asset file and call `shell.exec('cp', [src, dest])` individually.

**Why it's wrong:** Each shell.exec is an IPC round trip. 50 images = 50 round trips, each with overhead. Causes slow, janky UI progress.

**Do this instead:** Use `cp -r images/ dest/` to copy entire directories in one shell call. Only fall back to per-file copy when sanitizing filenames (which requires rename, not just copy).

### Anti-Pattern 2: Re-Extracting CSS Design Tokens

**What people do:** Parse `css/[site].css` to extract color values, font names, and spacing variables to populate design token tables in the brief.

**Why it's wrong:** Webflow CSS is complex, generated, and not token-structured. Re-extraction adds fragile regex work with unclear benefit — the agent can read the raw CSS itself.

**Do this instead:** Reference the CSS files directly in the brief (already copied to `.shipstudio/assets/`). The brief tells the agent: "Style reference is in `.shipstudio/assets/css/moneystack-website.css`."

### Anti-Pattern 3: Responsive Image De-duplication at Copy Time

**What people do:** Try to detect and collapse responsive variants (image.png, image-p-500.png, image-p-800.png) into a single entry at copy time.

**Why it's wrong:** The responsive variant suffix patterns (-p-130, -p-500, -p-800) are useful for the agent to understand that responsive images exist. Collapsing them silently loses information.

**Do this instead:** Copy all variants. In the asset manifest, group them by base name and annotate the relationship. The brief can note: "image.png has responsive variants at -p-500 and -p-800."

### Anti-Pattern 4: Inlining Shell Command Results Without Base64

**What people do:** Write brief markdown content to a file with `shell.exec('bash', ['-c', `echo "${markdown}" > brief.md`])`.

**Why it's wrong:** Markdown contains backticks, dollar signs, double quotes, newlines, and other shell metacharacters. The echo will break or corrupt the content.

**Do this instead:** Use the base64 pattern proven in the Figma plugin: `btoa(encodeURIComponent(markdown))`, then `echo '${encoded}' | base64 -d > brief.md`. This is safe for all content.

### Anti-Pattern 5: Parsing HTML with Full DOM Library

**What people do:** Bundle a full DOM parser (jsdom, cheerio) to traverse Webflow HTML.

**Why it's wrong:** Plugin bundle size is a concern (loaded over IPC). A full DOM library adds significant bundle weight. Webflow HTML structure is predictable enough for targeted regex extraction.

**Do this instead:** Use regex and string matching for the specific patterns needed: page titles (`<title>`), meta description, `data-wf-page`, Webflow class names, section headings (`<h1-h6>`), nav and footer markers. If cheerio is already acceptable bundle-weight, use it only if clearly simpler.

---

## Integration Points

### External Services

None. This plugin makes no network requests. All data comes from the local Webflow zip file.

### Internal Boundaries

| Boundary | Communication Pattern | Notes |
|----------|-----------------------|-------|
| MainView ↔ zip/ | Async function calls, typed return values | MainView owns the shell reference; passes it into zip functions |
| MainView ↔ layout/ | Async function calls passing ZipContents | layout/ is pure after receiving file contents |
| MainView ↔ assets/ | Async function calls; returns AssetManifest | assets/ uses shell for cp; returns manifest for brief |
| MainView ↔ brief/ | Sync call to generate.ts; async call to io.ts | generate.ts is pure; io.ts needs shell |
| zip/ ↔ layout/ | ZipContents data structure | zip discovers pages, layout reads them via shell |
| layout/ ↔ pages/ | ParsedPage[] array | Pages module does deeper per-page analysis on top of parsed data |
| All modules ↔ types.ts | Imports only | Shared types, no runtime coupling |

### Ship Studio Integration

| API | How Used | Notes |
|-----|----------|-------|
| `ctx.shell.exec` | All file I/O (unzip, cp, cat, mkdir, base64) | Only available after plugin mounts |
| `ctx.project.path` | Destination root for `.shipstudio/assets/` | Available from context; used as absolute base path |
| `ctx.storage.read/write` | Persist mode selection or last zip path across sessions | Optional; not required for MVP |
| `ctx.actions.showToast` | Per-step feedback (extracted, copied, brief ready) | Use `success` for completion steps, `error` for failures |
| `window.__SHIPSTUDIO_REACT__` | React runtime (externalized) | Must not bundle React; use window globals pattern |
| `slots.toolbar` | Plugin entry point registered with Ship Studio | The exported component rendered in the toolbar |

---

## Suggested Build Order

Based on data flow dependencies:

1. **Entry scaffolding** (`index.tsx`, `context.ts`, `types.ts`, `components/Modal.tsx`)
   — Establishes the plugin loads, toolbar button appears, modal opens. Unblocks all UI work.

2. **Zip I/O** (`zip/extract.ts`, `zip/discover.ts`)
   — Foundation for all subsequent work. Nothing else can run without the zip contents.

3. **Asset copying** (`assets/copy.ts`, `assets/sanitize.ts`, `assets/manifest.ts`)
   — Can be built before HTML parsing because it only needs the file list from `zip/discover.ts`. Produces the asset manifest that brief generation needs.

4. **Layout parsing** (`layout/parse.ts`, `layout/webflow.ts`, `layout/shared.ts`, `layout/routes.ts`)
   — Depends on zip I/O. Produces structured site data. Webflow-specific detection built here.

5. **Page analysis** (`pages/analyze.ts`)
   — Thin layer on top of layout parsing; depends on ParsedPage[].

6. **Brief generation** (`brief/generate.ts`, `brief/sections.ts`, `brief/io.ts`)
   — Depends on all data modules. Last to be built; pure function makes it testable independently with mock data.

7. **Full UI wiring** (`views/MainView.tsx`, `components/ModeSelector`, `components/ProgressBar`, `components/ResultsPanel`)
   — Connects all modules into the complete extraction pipeline. Built iteratively alongside the domain modules.

---

## Sources

- Direct inspection: `plugin-figma/src/` (sibling plugin, proven architecture — HIGH confidence)
- Direct inspection: `moneystack-website.webflow.zip` (actual Webflow export structure — HIGH confidence)
- Direct inspection: `plugin-figma/src/brief/io.ts` (base64 shell pattern — HIGH confidence)
- Direct inspection: `plugin-figma/src/types.ts` (Ship Studio plugin context API — HIGH confidence)
- PROJECT.md constraints and requirements (HIGH confidence)

---

*Architecture research for: Webflow-to-code Ship Studio plugin*
*Researched: 2026-03-16*
