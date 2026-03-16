# Phase 4: Site Analysis - Research

**Researched:** 2026-03-16
**Domain:** HTML parsing, Webflow structure analysis, shared layout detection, CMS template detection
**Confidence:** HIGH — based on direct inspection of the sample Webflow zip, existing codebase, sibling plugin patterns, and ARCHITECTURE/PITFALLS research

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All pages included, no filtering
- CSS referenced by path, not re-extracted as tokens
- All file ops through shell.exec
- Webflow validation already done in Phase 2 (data-wf-site confirmed)
- `src/analysis/` directory pre-created

### Claude's Discretion
- **Section detection**: How to identify major page sections from Webflow HTML — semantic elements, Webflow section classes, DOM depth heuristics, or a combination
- **Webflow component mapping**: What migration notes each `.w-*` component gets. How detailed the semantic description and replacement guidance should be
- **Shared layout detection**: How to compare nav/footer across pages — exact HTML string match, normalized comparison, or structural similarity. What threshold makes two elements "the same"
- **CMS template detection**: How to identify CMS pages — `detail_*.html` naming, `{{wf ...}}` placeholder scanning, `w-dyn-bind-empty` markers, empty body content, or a combination
- **Data structure design**: The shape of the analysis output (PageInfo, SectionBreakdown, ComponentInventory, etc.) — must be consumable by the brief generator in Phase 5
- **HTML parsing approach**: DOMParser (browser API available in Ship Studio's WebView) vs regex vs shell.exec with grep/sed

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-01 | Plugin discovers all HTML pages from the export and extracts title, route, and filename | `ZipManifest.entries[]` already has all filenames; regex extracts `<title>` from each HTML file read via `shell.exec('bash', ['-c', 'base64 < path'])` |
| PAGE-02 | Plugin generates a per-page structural breakdown (major sections: nav, hero, features, footer, etc.) | Webflow exports use `<section class="section_*">`, `<header class="section_*">`, and `<footer class="footer_*">` naming — regex against these patterns is the right approach |
| PAGE-03 | Brief references original CSS files by path rather than re-extracting design tokens | Already covered by AssetManifest.cssFiles from Phase 3 — analysis phase does not need to handle this |
| PAGE-04 | Plugin detects shared layout patterns (common nav/footer) across pages and flags them as "build once as shared component" | Webflow stamps a `data-w-id` on every pasted symbol — the nav `data-w-id="a618aae7-..."` is identical across ALL pages in the sample export; use this as the primary detection signal |
| WFLW-01 | Plugin recognizes Webflow component classes (.w-nav, .w-dropdown, .w-slider, .w-tabs, .w-form, .w-lightbox, .w-embed) and maps them to semantic descriptions with migration notes | Build a static registry of known `.w-*` classes with semantic labels and migration notes |
| WFLW-02 | Plugin detects JavaScript interactions (data-ix, animations, scroll triggers) and documents them in the brief | Attributes `data-animation`, `data-easing`, `data-duration-in`, `data-duration-out`, `data-w-id`, `data-collapse` are present in the sample export on interactive elements |
| WFLW-03 | Plugin identifies CMS template pages (containing placeholders not content) and flags them with an explanation | Three signals confirmed in the sample export: (1) `detail_*.html` filename prefix, (2) `w-dyn-bind-empty` class on content elements, (3) `<title>` starts with `|` (empty CMS field binding) |
</phase_requirements>

---

## Summary

Phase 4 builds the `src/analysis/` module: a pipeline that reads every HTML file from the extracted Webflow export and produces structured `SiteAnalysis` data. The data must be rich enough for Phase 5's brief generator to produce page lists, structural breakdowns, Webflow component inventories, shared layout flags, and CMS template warnings without needing to re-read any HTML.

HTML parsing uses the same `shell.exec('bash', ['-c', 'base64 < path'])` + `atob()` pattern already established in Phase 2/3. DOMParser (available in the Ship Studio WebView) is the right tool for walking the DOM — it avoids fragile regex for nested structures while keeping bundle size near zero (it's a browser built-in). Targeted regex remains appropriate for simple extractions like `<title>` and specific attribute patterns.

The most important architectural insight from the sample zip: Webflow's "pasted symbol" system stamps every shared component with an identical `data-w-id` UUID across all pages. The navbar in `index.html`, `blog.html`, and `features.html` all carry `data-w-id="a618aae7-335b-b9d4-02e7-3e7b4aa01a13"`. This is a reliable, zero-heuristic signal for shared layout detection — no fuzzy string comparison required. CMS templates are identified by three converging signals: `detail_` filename prefix, `w-dyn-bind-empty` classes on content elements, and a title that starts with `|` (unfilled CMS field).

**Primary recommendation:** Implement `src/analysis/` as four pure functions — `discoverPages`, `parsePage`, `detectSharedLayout`, `buildSiteAnalysis` — all taking `Shell` + file paths and returning typed data. Wire into `MainView` as a new `'analyzing'` ZipStep between `'copying'` and `'done'`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| DOMParser (browser built-in) | Web API | Parse HTML strings to DOM for querying | Zero bundle cost; available in Ship Studio WebView; handles Webflow's real HTML correctly |
| vitest | already configured | Unit testing pure analysis functions | Already used in Phases 2-3; zero setup cost |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Regex (built-in) | — | Extract `<title>`, `data-wf-page`, `data-w-id`, simple attributes | Fast, low-overhead for well-defined single-attribute extractions |
| shell.exec('bash', ['-c', 'base64 < path']) | Ship Studio API | Read HTML file content into string | All file reads — established pattern from Phase 2/3 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DOMParser (built-in) | cheerio | cheerio adds bundle weight (~40KB gzip); DOMParser is free since plugin runs in a WebView |
| DOMParser (built-in) | jsdom | jsdom is 500KB+ and inappropriate for plugin bundles |
| DOMParser (built-in) | regex-only parsing | Regex is brittle for nested elements (nav extraction, section children); DOMParser handles nesting correctly |
| data-w-id matching | String similarity (e.g., Levenshtein) | String similarity is probabilistic and adds complexity; data-w-id is a deterministic, Webflow-native signal |

**No installation required** — DOMParser is a browser built-in available in Ship Studio's WebView context.

---

## Architecture Patterns

### Recommended Module Structure

```
src/analysis/
├── types.ts          # SiteAnalysis, PageInfo, SectionItem, ComponentEntry, SharedLayout
├── parse.ts          # parsePage(shell, htmlPath) → PageInfo — reads one HTML file
├── webflow.ts        # WEBFLOW_COMPONENT_REGISTRY, detectComponents(), detectInteractions()
├── shared.ts         # detectSharedLayout(pages: PageInfo[]) → SharedLayout
└── analyze.ts        # buildSiteAnalysis(shell, entries, extractDir) → SiteAnalysis — orchestrates all
```

### Pattern 1: DOMParser for Structural Extraction

**What:** Read HTML via `base64 < path` through shell.exec, decode with `atob()`, parse with `new DOMParser().parseFromString(html, 'text/html')`, then use `document.querySelectorAll()` for extraction.

**When to use:** Whenever extracting multiple elements from the same HTML document (sections, component classes, headings). More reliable than regex for nested structures.

**Example:**
```typescript
// Source: MDN Web API — DOMParser available in all modern browser environments
async function parsePage(shell: Shell, htmlPath: string): Promise<PageInfo> {
  const b64 = await shell.exec('bash', ['-c', `base64 < '${htmlPath}'`]);
  const html = atob(b64.stdout.trim());
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const title = doc.querySelector('title')?.textContent?.trim() ?? '';
  const wfPage = doc.documentElement.getAttribute('data-wf-page') ?? '';

  // Extract major sections
  const sectionEls = doc.querySelectorAll(
    'section[class*="section_"], header[class*="section_"], div[class*="section_cta"], footer[class*="footer_"]'
  );
  const sections: SectionItem[] = Array.from(sectionEls).map(el => ({
    tag: el.tagName.toLowerCase(),
    className: el.className,
    label: inferSectionLabel(el.className),
  }));

  return { title, wfPage, sections, /* ... */ };
}
```

### Pattern 2: data-w-id Shared Layout Detection

**What:** Webflow stamps a unique UUID `data-w-id` on every element that originates from a "pasted symbol" (Webflow's copy-paste symbol system). The same UUID appears on the same component across all pages. Use this to detect shared nav/footer with zero heuristics.

**When to use:** Primary method for shared layout detection. Fall back to class-name matching only if `data-w-id` is absent.

**Example:**
```typescript
// Source: Direct inspection of moneystack-website.webflow.zip
// data-w-id="a618aae7-335b-b9d4-02e7-3e7b4aa01a13" appears on .w-nav across all pages
function detectSharedLayout(pages: PageInfo[]): SharedLayout {
  // Count how many pages share each data-w-id for nav/footer elements
  const navIds = new Map<string, number>();
  const footerIds = new Map<string, number>();

  for (const page of pages) {
    if (page.navWfId) navIds.set(page.navWfId, (navIds.get(page.navWfId) ?? 0) + 1);
    if (page.footerWfId) footerIds.set(page.footerWfId, (footerIds.get(page.footerWfId) ?? 0) + 1);
  }

  // A nav/footer is "shared" if it appears on > 50% of non-CMS pages
  const contentPages = pages.filter(p => !p.isCmsTemplate);
  const threshold = Math.ceil(contentPages.length * 0.5);

  const sharedNavId = [...navIds.entries()].find(([, count]) => count >= threshold)?.[0];
  const sharedFooterId = [...footerIds.entries()].find(([, count]) => count >= threshold)?.[0];

  return {
    hasSharedNav: !!sharedNavId,
    navWfId: sharedNavId,
    hasSharedFooter: !!sharedFooterId,
    footerWfId: sharedFooterId,
  };
}
```

### Pattern 3: CMS Template Detection (Three-Signal Approach)

**What:** Three independent signals all indicate a CMS template page. A page is flagged as CMS template if ANY signal is present.

**Signals confirmed in sample export:**
1. Filename starts with `detail_` (e.g., `detail_post.html`, `detail_countries.html`)
2. HTML contains elements with class `w-dyn-bind-empty` (Webflow CMS dynamic binding placeholder)
3. `<title>` content starts with `|` — unfilled CMS field binding (e.g., `| Moneystack Blog`)

**Example:**
```typescript
// Source: Direct inspection of moneystack-website.webflow.zip
function detectCmsTemplate(filename: string, doc: Document): boolean {
  // Signal 1: filename convention
  const basename = filename.split('/').pop() ?? filename;
  if (basename.startsWith('detail_')) return true;

  // Signal 2: w-dyn-bind-empty present (CMS content placeholder)
  if (doc.querySelector('.w-dyn-bind-empty') !== null) return true;

  // Signal 3: title starts with | (unfilled CMS binding)
  const title = doc.querySelector('title')?.textContent?.trim() ?? '';
  if (title.startsWith('|')) return true;

  return false;
}
```

### Pattern 4: Webflow Component Registry (Static Map)

**What:** A static registry mapping known `.w-*` class prefixes to semantic labels and migration notes. Applied to every page's full class list.

**Example:**
```typescript
// Source: Direct inspection of moneystack-website.webflow.zip + Webflow docs
export const WEBFLOW_COMPONENT_REGISTRY: Record<string, ComponentDef> = {
  'w-nav':        { label: 'Navbar',    migration: 'Replace with semantic <nav> + mobile hamburger. w-nav JS handles collapse — rebuild with CSS/JS toggle.' },
  'w-dropdown':   { label: 'Dropdown',  migration: 'Replace with <details>/<summary> or CSS :hover + focus-within pattern. Webflow JS drives open/close.' },
  'w-slider':     { label: 'Slider',    migration: 'Replace with a carousel library (Embla, Swiper) or CSS scroll snap. w-slider JS is non-portable.' },
  'w-tabs':       { label: 'Tabs',      migration: 'Replace with accessible tab pattern (ARIA role="tablist"). Webflow JS drives panel switching.' },
  'w-form':       { label: 'Form',      migration: 'Form HTML is usable; replace Webflow form handling backend (does not work off Webflow hosting). Use Resend, Formspree, or server actions.' },
  'w-lightbox':   { label: 'Lightbox',  migration: 'Replace with <dialog> element or a lightbox library. Webflow JS drives open/close/media display.' },
  'w-embed':      { label: 'HTML Embed', migration: 'Custom HTML embed — review contents. May contain third-party scripts; preserve as-is or integrate natively.' },
  'w-richtext':   { label: 'Rich Text', migration: 'CMS-bound rich text area. Wrap in prose CSS (e.g., Tailwind @typography) for correct rendering.' },
  'w-background-video': { label: 'Background Video', migration: 'Replace with <video autoplay muted loop playsinline>. Video URLs in data-video-urls attr point to Webflow CDN — re-host the local copies.' },
  'w-dyn-list':   { label: 'CMS Collection List', migration: 'CMS-driven list. Replace with static data array or API fetch. No data exported in zip.' },
};
```

### Pattern 5: Section Label Inference

**What:** Webflow sites typically use class naming conventions like `section_hero`, `section_faq`, `footer_component`. Extract the semantic label by stripping the `section_` prefix.

**Confirmed patterns in moneystack sample:**
- `section_header` → header/hero
- `section_how` → how-it-works
- `section_what` → what-section
- `section_testimonial` → testimonials
- `section_faq` → FAQ
- `section_cta` → call-to-action
- `footer_component` → footer
- `section_blog-post5-header` → blog post header

**Example:**
```typescript
function inferSectionLabel(className: string): string {
  // Look for section_ or footer_ prefix in class list
  const classes = className.split(/\s+/);
  for (const cls of classes) {
    if (cls.startsWith('section_')) return cls.replace('section_', '').replace(/-/g, ' ');
    if (cls.startsWith('footer_')) return 'footer';
    if (cls.startsWith('header_')) return 'header';
  }
  // Fallback: use tag-based inference
  return 'section';
}
```

### Pattern 6: Route Inference from Filename

**What:** Convert HTML filenames to URL routes. Already confirmed by the existing `ZipManifest.entries[]` which contains paths like `legal/terms-of-service.html`.

**Rules (confirmed against sample):**
- `index.html` → `/`
- `about.html` → `/about`
- `blog.html` → `/blog`
- `legal/terms-of-service.html` → `/legal/terms-of-service`
- `detail_post.html` → `/blog/[slug]` (CMS template — use collection name from filename)

**Example:**
```typescript
function inferRoute(filename: string): string {
  // Strip .html extension
  const withoutExt = filename.replace(/\.html$/, '');
  // index.html is root
  if (withoutExt === 'index') return '/';
  // CMS templates: detail_post → /blog/[slug] type inference
  if (withoutExt.startsWith('detail_')) {
    const collection = withoutExt.replace('detail_', '');
    return `/${collection}/[slug]`;
  }
  // Normal pages
  return '/' + withoutExt;
}
```

### Pattern 7: ZipStep Integration

**What:** Add `'analyzing'` to the `ZipStep` union type and wire it between `'copying'` and `'done'` in `MainView`. The `done` variant must carry `siteAnalysis` for Phase 5.

**Changes required:**
- `src/zip/types.ts`: Add `| { kind: 'analyzing' }` to `ZipStep`
- `src/zip/types.ts`: Add `siteAnalysis?: SiteAnalysis` to `done` variant
- `src/views/MainView.tsx`: Add Step 5 (analyzing) after asset copy, before done

### Anti-Patterns to Avoid

- **Regex for nested HTML structures:** Regex breaks on multi-line class attributes, nested elements, and attribute order variation. Use DOMParser for anything that requires traversal.
- **Reading ALL HTML into memory at once for large sites:** Each page is 30–160KB. For 25 pages that's ~1MB total — acceptable to process sequentially but not all simultaneously in a Map.
- **Treating `data-w-id` UUIDs as stable across all Webflow sites:** The `data-w-id` is stable for a given Webflow project's pasted symbols. On a different site, the UUIDs will differ. The detection logic checks frequency across pages, not against a hardcoded UUID.
- **Counting `detail_*.html` files as content pages in the page count:** The brief must distinguish "N content pages + M CMS templates" — never a flat count that conflates both.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Nested regex parser | DOMParser (browser built-in) | Handles real-world Webflow HTML; zero bundle cost; free querySelectorAll |
| Shared layout detection | Levenshtein/diff similarity | data-w-id UUID matching | Webflow already stamps the signal; no fuzzy math needed |
| CMS detection | ML classifier or complex heuristics | Three-signal boolean check | Sample export proves all three signals are reliable and sufficient |
| Webflow component lookup | Runtime discovery from class scan | Static WEBFLOW_COMPONENT_REGISTRY | The 10 known `.w-*` components are a closed set; static map is faster and fully testable |

---

## Common Pitfalls

### Pitfall 1: DOMParser Window Context Assumption

**What goes wrong:** DOMParser works fine in the Ship Studio WebView browser context, but if any analysis function is called outside a browser context (e.g., in a Node.js test environment via vitest), `new DOMParser()` will throw `DOMParser is not defined`.

**Why it happens:** Ship Studio WebView runs in Electron's renderer process (browser APIs available). Vitest runs in Node.js by default.

**How to avoid:** Configure vitest to use `jsdom` environment for analysis tests. Add `// @vitest-environment jsdom` at the top of analysis test files. This makes tests run in a simulated browser environment with DOMParser available.

**Warning signs:** Test suite passes in isolation but fails when running vitest with default Node environment.

### Pitfall 2: CMS Template Title Starts with `|` — but Not All Empty Titles Do

**What goes wrong:** Using `title.startsWith('|')` as the sole CMS detection signal catches `detail_post.html` (`| Moneystack Blog`) but misses a static page that has a legitimate `|` title (e.g., `Pricing | Moneystack`).

**Why it happens:** `Pricing | Moneystack` — the `|` is in the middle, not at the start. The signal is `startsWith('|')`, not `includes('|')`.

**How to avoid:** Use `startsWith('|')` not `includes('|')`. Combined with the other two signals (`detail_` prefix, `w-dyn-bind-empty`), false positives are eliminated.

### Pitfall 3: data-w-id Detection Breaks on Symbol-Free Sites

**What goes wrong:** A Webflow site that doesn't use copy-pasted symbols (nav built inline on each page) will have different `data-w-id` values on each page's nav. The shared layout detector concludes no shared nav exists, even though the nav HTML is visually identical.

**Why it happens:** Webflow only stamps matching `data-w-id` UUIDs when elements are pasted from a symbol. Inline nav on each page has unique IDs.

**How to avoid:** Implement fallback: when `data-w-id` frequency is below threshold, compare the outer class of `.w-nav` elements. If the same class name (e.g., `navbar_component`) appears on > 50% of pages, flag as "likely shared — build once." This is less precise but better than nothing.

**Warning signs:** Shared layout detection reports "no shared nav" on a site with an obviously consistent header.

### Pitfall 4: HTML Files in Subdirectories Break Path Construction

**What goes wrong:** The ZipManifest contains entries like `legal/terms-of-service.html`. The `shell.exec('bash', ['-c', 'base64 < path'])` call receives `extractDir + '/' + 'legal/terms-of-service.html'` — this works correctly. But route inference must use the FULL path `legal/terms-of-service` → `/legal/terms-of-service`, not just the basename.

**How to avoid:** Route inference receives the full entry path (e.g., `legal/terms-of-service.html`), strips `.html`, prepends `/`. Verified: the sample export has `legal/terms-of-service.html` and `legal/privacy-policy.html`.

### Pitfall 5: Webflow Absolute CDN URLs in Video src Attributes

**What goes wrong:** The sample export's `index.html` contains video elements with `src="https://uploads-ssl.webflow.com/..."`. These are Webflow CDN URLs, not local files. When the brief references them, the agent copies the HTML verbatim — the videos will 404 after migrating off Webflow hosting.

**How to avoid:** During page analysis, detect `data-video-urls` attributes containing `uploads-ssl.webflow.com` URLs and flag the page as having "hosted video references — CDN URLs will break off Webflow hosting." The locally-copied video files (from Phase 3) are the correct references.

### Pitfall 6: Sequential Shell.exec Reads Are Slow for 25+ Pages

**What goes wrong:** Reading 25 HTML files sequentially with one `shell.exec` call each takes ~300ms × 25 = 7.5 seconds of blocking IPC latency.

**How to avoid:** Batch-read all HTML files in a single shell call using a bash loop or `cat` of multiple files. Alternatively, accept the latency and show per-page progress ("Analyzing page 3/25..."). Per-page progress feedback is the simpler approach and matches the ZipStep pattern.

---

## Code Examples

### HTML Page Discovery (Filtering from ZipManifest)
```typescript
// Source: Existing ZipManifest.entries pattern from src/zip/discover.ts
function discoverHtmlPages(entries: string[]): string[] {
  return entries.filter(
    e => e.endsWith('.html') && !e.endsWith('/') && !e.startsWith('__MACOSX')
  );
}
// Confirmed against moneystack-website.webflow.zip: 21 HTML entries total
// (includes subdirectory pages like legal/terms-of-service.html)
```

### Full Page Parse Function Signature
```typescript
// src/analysis/parse.ts
export interface PageInfo {
  filename: string;           // e.g., "legal/terms-of-service.html"
  route: string;              // e.g., "/legal/terms-of-service"
  title: string;              // from <title>
  wfPageId: string;           // from data-wf-page attribute
  isCmsTemplate: boolean;     // three-signal detection
  sections: SectionItem[];    // major structural sections
  webflowComponents: ComponentEntry[]; // .w-* inventory
  hasIx2Interactions: boolean; // data-animation, data-easing, data-w-id on interactive elements
  navWfId: string | null;     // data-w-id of .w-nav element (for shared layout)
  footerWfId: string | null;  // data-w-id of footer element
}

export interface SectionItem {
  tag: string;       // "section", "header", "footer", "div"
  className: string; // full class string from element
  label: string;     // inferred human label ("hero", "features", "faq")
}

export interface ComponentEntry {
  wClass: string;    // e.g., "w-nav", "w-tabs"
  label: string;     // e.g., "Navbar"
  count: number;     // number of instances on this page
  migration: string; // guidance string from registry
}
```

### SiteAnalysis Output Type (consumed by Phase 5 brief generator)
```typescript
// src/analysis/types.ts
export interface SiteAnalysis {
  pages: PageInfo[];                 // all HTML pages analyzed
  sharedLayout: SharedLayout;        // detected shared nav/footer
  contentPageCount: number;          // pages.filter(p => !p.isCmsTemplate).length
  cmsTemplateCount: number;          // pages.filter(p => p.isCmsTemplate).length
  allWebflowComponents: string[];    // union of all w-* classes across site (for IX2 summary)
}

export interface SharedLayout {
  hasSharedNav: boolean;
  navWfId: string | undefined;       // the w-id that identifies the shared nav
  hasSharedFooter: boolean;
  footerWfId: string | undefined;
  confidence: 'high' | 'medium';    // 'high' if data-w-id match, 'medium' if class-name fallback
}
```

### MainView Integration — ZipStep Changes
```typescript
// src/zip/types.ts — add analyzing variant and update done
import type { SiteAnalysis } from '../analysis/types';

export type ZipStep =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'copying'; label: string }
  | { kind: 'analyzing'; pageCount: number }                           // NEW
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number; assetManifest?: AssetManifest; siteAnalysis?: SiteAnalysis } // updated
  | { kind: 'error'; message: string };
```

---

## Webflow Component Reference

Full registry of components found in Webflow exports. Confirmed against moneystack sample.

| Class Prefix | Label | JS-Dependent | Migration Path |
|-------------|-------|-------------|----------------|
| `w-nav` | Navbar | YES | Semantic `<nav>` + CSS mobile hamburger. Collapse behavior needs custom JS. |
| `w-dropdown` | Dropdown | YES | CSS `:hover`/`:focus-within` or `<details>`. Webflow JS drives open state. |
| `w-tabs` | Tab Switcher | YES | ARIA `role="tablist"` pattern. `data-current`, `data-duration-in` attrs are Webflow-specific. |
| `w-slider` | Slider/Carousel | YES | Embla, Swiper, or CSS scroll-snap. Non-portable. |
| `w-form` | Form | PARTIAL | Form HTML is usable. Backend (Webflow form handler) does not work off Webflow hosting. |
| `w-lightbox` | Lightbox | YES | `<dialog>` element or Fancybox/PhotoSwipe. |
| `w-embed` | HTML Embed | NO | Custom HTML block. Preserve contents; may need integration work. |
| `w-richtext` | Rich Text | NO | CMS content area. Apply prose CSS class for typography. |
| `w-background-video` | Background Video | NO | `<video autoplay muted loop playsinline>`. Re-host from `.shipstudio/assets/videos/`. |
| `w-dyn-list` | CMS Collection List | NO | Replace with static data or API fetch. No data in export. |

**IX2 Interaction Detection — Confirmed attribute patterns:**
- `data-animation` — navbar collapse animation, section reveal
- `data-easing`, `data-easing2` — animation easing
- `data-duration-in`, `data-duration-out` — tab/dropdown transition duration
- `data-collapse="medium"` — navbar mobile breakpoint
- `data-w-id` on interactive containers — Webflow interaction system identifier
- `data-w-bg-video-control` — background video play/pause button

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Parse HTML with regex for everything | DOMParser for structure + regex for attributes | DOMParser handles real Webflow HTML reliably; regex still appropriate for simple attribute grabs |
| Detect shared layout by string diffing HTML blocks | Match data-w-id UUIDs across pages | Zero-heuristic, Webflow-native signal; eliminates false positives |
| Flag CMS pages only by filename convention | Three-signal approach (filename + w-dyn-bind-empty + empty title) | Catches both named CMS pages (detail_*) and generic CMS collection pages |

---

## Open Questions

1. **Vitest environment for DOMParser tests**
   - What we know: vitest uses Node.js by default; DOMParser is not available in Node.js
   - What's unclear: Whether the existing vitest.config.ts needs `environment: 'jsdom'` added globally or per-file
   - Recommendation: Add `// @vitest-environment jsdom` at the top of each analysis test file; avoids changing global config and potentially breaking existing zip/asset tests that don't need DOM

2. **401.html and style-guide.html classification**
   - What we know: Sample export contains `401.html` (error page) and `style-guide.html` (Webflow design reference) — neither is a real content page nor a CMS template
   - What's unclear: Should these be excluded from the page inventory, or flagged as "utility pages"?
   - Recommendation: Include them in `pages[]` but add an `isUtilityPage` flag. Detection: `401.html`, `404.html` → utility/error page. `style-guide.html` → utility/reference page (detect by `style-guide` in filename).

3. **Webflow absolute CDN video URLs in data-video-urls**
   - What we know: `data-video-urls` attributes in `index.html` contain `https://uploads-ssl.webflow.com/` URLs — these are CDN-hosted, not local files
   - What's unclear: The Phase 3 asset copy may not have copied these videos since they aren't in `videos/` directory entries
   - Recommendation: During analysis, detect `uploads-ssl.webflow.com` URLs on video elements and flag them in the page analysis as "CDN video references — check `.shipstudio/assets/videos/` for local copies"

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (already configured) |
| Config file | `vitest.config.ts` — `include: ['src/**/*.test.ts']` |
| Quick run command | `npx vitest run src/analysis/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | `discoverHtmlPages()` returns all HTML entries excluding directories | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ Wave 0 |
| PAGE-01 | `inferRoute()` converts filenames to routes including subdirectory paths | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ Wave 0 |
| PAGE-01 | `parsePage()` extracts title and wfPageId from HTML string | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ Wave 0 |
| PAGE-02 | `parsePage()` extracts sections from Webflow HTML using section_ class patterns | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ Wave 0 |
| PAGE-04 | `detectSharedLayout()` flags shared nav when data-w-id matches across pages | unit | `npx vitest run src/analysis/shared.test.ts` | ❌ Wave 0 |
| PAGE-04 | `detectSharedLayout()` uses class-name fallback when no data-w-id match | unit | `npx vitest run src/analysis/shared.test.ts` | ❌ Wave 0 |
| WFLW-01 | `detectComponents()` maps w-nav, w-tabs, w-form etc. to registry entries | unit | `npx vitest run src/analysis/webflow.test.ts` | ❌ Wave 0 |
| WFLW-02 | `detectInteractions()` returns true for elements with data-animation attributes | unit | `npx vitest run src/analysis/webflow.test.ts` | ❌ Wave 0 |
| WFLW-03 | `detectCmsTemplate()` returns true for detail_ prefix | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ Wave 0 |
| WFLW-03 | `detectCmsTemplate()` returns true for w-dyn-bind-empty marker | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ Wave 0 |
| WFLW-03 | `detectCmsTemplate()` returns true for title starting with `\|` | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/analysis/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/analysis/parse.test.ts` — covers PAGE-01, PAGE-02, WFLW-03. Requires `// @vitest-environment jsdom` header for DOMParser.
- [ ] `src/analysis/webflow.test.ts` — covers WFLW-01, WFLW-02
- [ ] `src/analysis/shared.test.ts` — covers PAGE-04
- [ ] `src/analysis/types.ts` — type definitions (no tests, but must exist before any test files)

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `moneystack-website.webflow.zip` — confirmed HTML structure, section naming conventions, `data-w-id` UUID consistency across pages, CMS template signals (`w-dyn-bind-empty`, `| Moneystack Blog` title), all `.w-*` component classes present
- `src/zip/types.ts`, `src/zip/discover.ts`, `src/assets/types.ts`, `src/assets/manifest.ts`, `src/views/MainView.tsx` — existing codebase patterns
- `.planning/research/ARCHITECTURE.md` — component boundaries, shell.exec patterns, data flow
- `.planning/research/PITFALLS.md` — CMS template traps, IX2 documentation requirements
- `src/zip/discover.test.ts`, `src/assets/manifest.test.ts` — established test patterns (Mock Shell, vitest)
- `vitest.config.ts` — confirmed test configuration

### Secondary (MEDIUM confidence)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/layout/normalize.ts` — analogous tree normalization pattern for dispatcher + typed output structure
- `.planning/research/FEATURES.md` — Webflow component semantic mapping requirements, feature priority matrix
- MDN Web API: DOMParser — browser built-in, available in WebView context

### Tertiary (LOW confidence)
- None — all critical claims verified against source code or direct zip inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — DOMParser confirmed available in WebView; vitest confirmed configured
- Architecture: HIGH — data-w-id signal directly observed in sample zip; section naming confirmed
- CMS detection: HIGH — all three signals directly observed (`detail_*` files, `w-dyn-bind-empty`, `| title` pattern)
- Pitfalls: HIGH — DOMParser/vitest environment issue is a known vitest gotcha; CDN video URL issue observed directly in zip

**Research date:** 2026-03-16
**Valid until:** 2026-06-16 (stable — Webflow export format and Ship Studio plugin API are not fast-moving)
