# Phase 3: Asset Pipeline - Research

**Researched:** 2026-03-16
**Domain:** File copy operations, asset classification, responsive image grouping, typed asset manifest construction
**Confidence:** HIGH — based on direct inspection of the sample Webflow zip, the existing codebase (phases 1-2), and the sibling Figma plugin's proven patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Assets destination: `.shipstudio/assets/` (project-level)
- Copy all media including videos — no optimization or transcoding
- All file ops through `shell.exec`
- Extraction temp dir: `.shipstudio/tmp/{sanitized-name}/` (Phase 2)

### Claude's Discretion
All implementation decisions for this phase are at Claude's discretion:

- **Asset directory layout**: How to organize files in `.shipstudio/assets/` — flat, mirroring the zip structure (images/, css/, videos/), or reorganized by type
- **Responsive image grouping**: How to detect and group -p-500/-p-800 variants under a single base-name entry, and what the grouped entry looks like in the manifest
- **Manifest data structure**: Fields per asset (path, purpose, type, referencing pages), how purpose is inferred (from directory, filename, or file type), and how page references are determined
- **Copy strategy**: Whether to use individual `shell.exec('cp', ...)` calls or a batch approach like `cp -r`
- **CSS and JS handling**: Whether CSS/JS files go to `.shipstudio/assets/` alongside media or are handled differently (they're referenced in the brief as CSS files, not "assets")

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ASST-01 | Plugin copies all media assets (images, SVGs, fonts, videos) to `.shipstudio/assets/` | Copy strategy section, directory layout recommendation, shell.exec `cp -r` per-directory pattern |
| ASST-02 | Brief contains an asset manifest table listing every copied asset with path, inferred purpose, and referencing page(s) | Manifest data structure section, purpose inference rules, page-reference approach |
| ASST-03 | Plugin groups responsive image variants (-p-500, -p-800, etc.) as srcset families in the asset manifest | Responsive grouping algorithm, variant regex, srcset family shape |
</phase_requirements>

---

## Summary

Phase 3 copies all media assets from the extracted Webflow zip's temp directory into `.shipstudio/assets/` and builds a typed `AssetManifest` that the brief generator (Phase 5) will consume. The phase adds a `'copying'` step to the existing `ZipStep` state machine and produces a manifest containing one entry per unique base image, one entry per video source, one entry per SVG, and one entry per font file — with responsive image variants annotated under their parent entry rather than listed individually.

The Webflow zip structure is fully known from direct inspection of `moneystack-website.webflow.zip`: assets live in `images/`, `videos/`, and (when custom fonts are present) `fonts/`. The zip never has a `fonts/` directory if the site uses only Google Fonts via WebFont.js. CSS and JS files are NOT media assets and go through a different path — the brief references them directly by path, not through the asset manifest. No fonts directory exists in the Moneystack sample, but the code must handle the case where one does.

The most important implementation decision is responsive variant grouping. The sample zip has images like `update-chart-1.png`, `update-chart-1-p-500.png`, `update-chart-1-p-800.png` as three separate files. Left ungrouped, a 50-image site appears as 300+ entries. The grouping regex strips the `-p-[0-9]+(x[0-9]+)?(q[0-9]+)?` suffix pattern (observed variants: `-p-130x130q80`, `-p-500`, `-p-800`) to find the canonical base name and collect variants underneath it.

**Primary recommendation:** Mirror the zip's directory layout in `.shipstudio/assets/` (`images/`, `videos/`, `fonts/`). Use `cp -r` per directory (one shell.exec call each) for bulk copy, then build the manifest from `ZipManifest.entries[]` in-process — no additional shell reads needed.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (built-in) | — | Type-safe manifest structures | Project standard, all existing files use it |
| shell.exec | — | `cp -r`, `mkdir -p`, `test -d` | Only file I/O mechanism in the plugin architecture |
| Vitest | configured | Unit tests for manifest building and grouping logic | Already configured in `vitest.config.ts`; phases 1-2 tests exist as model |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Regex (built-in) | — | Responsive variant suffix stripping | In `assets/manifest.ts` to group variants |
| Node.js path ops (string-only) | — | Extension detection, base name extraction | Avoid Node `path` module — keep it plain string ops to stay bundle-friendly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `cp -r images/` (directory) | Per-file `cp` loop | Per-file loop = N IPC round trips; directory `cp -r` = 1 call. Always use directory copy. |
| Manifest built in-process from `entries[]` | Re-scan directory via `ls` after copy | Re-scan requires more shell.exec calls and can encounter timing issues; `entries[]` already contains the full list. |
| Mirror zip structure in `.shipstudio/assets/` | Flat all-in-one directory | Flat loses type context and complicates CSS relative-path references. Mirror is simpler. |

**Installation:** No new packages needed for this phase.

---

## Architecture Patterns

### Recommended Project Structure

The `src/assets/` directory is pre-created with a `.gitkeep`. This phase creates three files there:

```
src/assets/
├── copy.ts       # copyAssets(shell, extractDir, projectPath, entries, onProgress) → AssetManifest
├── manifest.ts   # buildManifest(entries, assetsDir) → AssetManifest (pure, no shell)
└── types.ts      # AssetEntry, AssetManifest, AssetType
```

### Pattern 1: Directory-at-a-Time Copy

**What:** Copy each media directory with a single `cp -r` call rather than iterating files.

**When to use:** Always, for `images/`, `videos/`, `fonts/` directories. Only fall back to per-file copy if a future phase needs filename sanitization during copy (not needed here — the brief uses original filenames to match the Webflow HTML's `src=` attributes).

**Example:**
```typescript
// Source: established shell.exec pattern from src/zip/extract.ts and ARCHITECTURE.md
async function copyDirectory(
  shell: Shell,
  srcDir: string,
  destDir: string,
  label: string,
  onProgress?: (label: string) => void,
): Promise<void> {
  // Check if source directory exists before attempting copy
  const checkResult = await shell.exec('bash', ['-c', `test -d '${srcDir}' && echo exists || echo absent`]);
  if (checkResult.stdout.trim() === 'absent') return; // fonts/ may not exist

  onProgress?.(label);
  const mkResult = await shell.exec('mkdir', ['-p', destDir]);
  if (mkResult.exit_code !== 0) throw new Error(`mkdir failed: ${mkResult.stderr}`);

  const cpResult = await shell.exec('bash', ['-c', `cp -r '${srcDir}/.' '${destDir}/'`]);
  if (cpResult.exit_code !== 0) throw new Error(`copy failed: ${cpResult.stderr}`);
}
```

**Why `cp -r '${srcDir}/.'` instead of `cp -r '${srcDir}/'`:** The trailing `/.` copies directory _contents_ into the destination without creating a nested subdirectory. This mirrors zip structure without double-nesting.

### Pattern 2: In-Process Manifest Building from entries[]

**What:** Build the asset manifest entirely in TypeScript from `ZipManifest.entries[]` — no shell filesystem reads after the copy is complete.

**When to use:** Always. `entries[]` is the authoritative list of what was in the zip, and by extension what was copied. Avoids the cost and fragility of `ls` post-copy.

**Example:**
```typescript
// Source: inferred from ZipManifest.entries[] shape in src/zip/types.ts
export function buildManifest(entries: string[], assetsDestDir: string): AssetManifest {
  const imageEntries = entries.filter(e => isImageEntry(e));
  const videoEntries = entries.filter(e => e.startsWith('videos/') && !e.endsWith('/'));
  const fontEntries  = entries.filter(e => e.startsWith('fonts/')  && !e.endsWith('/'));
  const svgEntries   = entries.filter(e => e.startsWith('images/') && e.endsWith('.svg'));

  return {
    images: groupResponsiveVariants(imageEntries, assetsDestDir),
    videos: buildVideoGroups(videoEntries, assetsDestDir),
    fonts:  fontEntries.map(e => buildFontEntry(e, assetsDestDir)),
  };
}
```

### Pattern 3: Responsive Variant Grouping Algorithm

**What:** Strip the Webflow responsive suffix from image filenames to find the base name, then group all files sharing a base name under one `AssetEntry` with a `variants[]` field.

**Observed suffix patterns (from moneystack-website.webflow.zip):**
- `-p-500` (standard width breakpoint)
- `-p-800`
- `-p-130x130q80` (width x height + quality)

**Generalised regex:** `/(-p-\d+(?:x\d+)?(?:q\d+)?)(\.[^.]+)$/`

**Example:**
```typescript
// Pure function — no shell required
export function stripVariantSuffix(filename: string): string {
  // Strip -p-NNN, -p-NNNxNNN, -p-NNNxNNNqNN before the extension
  return filename.replace(/(-p-\d+(?:x\d+)?(?:q\d+)?)(\.[^.]+)$/, '$2');
}

export function groupResponsiveVariants(
  imageEntries: string[],
  assetsDir: string,
): AssetEntry[] {
  const groups = new Map<string, { canonical: string; variants: string[] }>();

  for (const entry of imageEntries) {
    const filename = entry.split('/').pop()!;
    const baseName = stripVariantSuffix(filename);
    const key = baseName.toLowerCase();

    if (!groups.has(key)) {
      // Check if a canonical (non-variant) file exists for this base name
      const canonical = imageEntries.find(e => e.split('/').pop() === baseName) ?? entry;
      groups.set(key, { canonical, variants: [] });
    }

    if (filename !== baseName) {
      groups.get(key)!.variants.push(filename);
    }
  }

  return Array.from(groups.values()).map(({ canonical, variants }) => {
    const filename = canonical.split('/').pop()!;
    return {
      filename,
      path: `${assetsDir}/images/${filename}`,
      type: 'image' as AssetType,
      purpose: inferImagePurpose(filename),
      variants: variants.length > 0 ? variants : undefined,
    };
  });
}
```

### Pattern 4: Video Group Building

**What:** Group video sources with their transcodes and poster thumbnails. From the zip inspection, the pattern is:
- Source: `{name}.mp4` or `{name}.mov`
- Transcodes: `{name}-transcode.mp4`, `{name}-transcode.webm`
- Poster: `{name}-poster-00001.jpg`

**Example:**
```typescript
export function buildVideoGroups(videoEntries: string[], assetsDir: string): VideoEntry[] {
  const sources = videoEntries.filter(e => {
    const f = e.split('/').pop()!;
    return !f.includes('-transcode') && !f.includes('-poster-');
  });

  return sources.map(srcEntry => {
    const filename = srcEntry.split('/').pop()!;
    const baseName = filename.replace(/\.[^.]+$/, ''); // strip extension
    const transcodes = videoEntries
      .filter(e => e.split('/').pop()!.startsWith(baseName + '-transcode'))
      .map(e => e.split('/').pop()!);
    const poster = videoEntries
      .find(e => e.split('/').pop()!.startsWith(baseName + '-poster-'))
      ?.split('/').pop();

    return {
      filename,
      path: `${assetsDir}/videos/${filename}`,
      type: 'video' as AssetType,
      purpose: 'video',
      transcodes: transcodes.length > 0 ? transcodes : undefined,
      poster,
    };
  });
}
```

### Pattern 5: ZipStep Extension for 'copying' Progress

**What:** Add a `'copying'` step to the existing `ZipStep` union type and wire it into `MainView.tsx`.

**Existing ZipStep** (in `src/zip/types.ts`):
```typescript
export type ZipStep =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number }
  | { kind: 'error'; message: string };
```

**Extended ZipStep** — add after `'validating'`:
```typescript
  | { kind: 'copying'; label: string }
```

**MainView.tsx integration point:** After the `// Step 3: Validate` block and before `// Step 4: Done`, insert:
```typescript
// Step 4: Copy assets
setStep({ kind: 'copying', label: 'Copying assets...' });
let assetManifest: AssetManifest;
try {
  assetManifest = await copyAssets(shell, extractDir, projectPath, manifest.entries, (label) => {
    setStep({ kind: 'copying', label });
  });
} catch (err: any) {
  setStep({ kind: 'error', message: err?.message || 'Asset copy failed' });
  return;
}
// Step 5: Done (was Step 4)
setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount, assetManifest });
```

The `'done'` variant also needs to gain an `assetManifest` field for downstream phases to access it.

### Pattern 6: Purpose Inference Rules

**What:** Infer the `purpose` string for each asset from its filename and type — purely in TypeScript, no HTML parsing (that's Phase 4's job).

**Rules (priority order):**
| Condition | Purpose |
|-----------|---------|
| `favicon.png` or `webclip.png` | `'favicon'` |
| filename contains `logo` | `'logo'` |
| filename contains `placeholder` | `'placeholder'` |
| SVG extension | `'icon-or-graphic'` |
| GIF extension | `'animation'` |
| video type | `'video'` |
| font type | `'font'` |
| otherwise | `'image'` |

Page references (ASST-02 "referencing page(s)") cannot be determined without HTML parsing. This phase produces `referencingPages: []` (empty) for all entries. Phase 4 (HTML parsing) populates this field by scanning `src=` and `href=` attributes in each HTML file. The manifest type must include the field so Phase 4 can fill it in.

### Anti-Patterns to Avoid

- **Per-file copy loop:** Never loop over individual image files calling `shell.exec('cp', [src, dest])` for each. Use `cp -r` per directory (1 IPC call). Only deviate if per-file rename is required (it is not in this phase).
- **Post-copy ls scan:** Do not re-scan the destination directory after copy to build the manifest. Use `entries[]` from the already-parsed `ZipManifest`.
- **Listing responsive variants as top-level entries:** The manifest must show 50 images, not 300+. Always group at build time.
- **Including CSS/JS in the asset manifest:** CSS files (`css/*.css`) and JS files (`js/*.js`) are NOT media assets. They go directly to `.shipstudio/assets/css/` and `.shipstudio/assets/js/` but are excluded from the `AssetManifest` images/videos/fonts arrays. The brief references them separately.
- **Absolute paths in the manifest for brief consumption:** Store project-relative paths (e.g., `.shipstudio/assets/images/hero.png`), not absolute machine paths. Absolute paths would leak user home directory structure into the brief.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bulk file copy | Per-file copy loop | `shell.exec('bash', ['-c', "cp -r '${src}/.' '${dest}/'"])` | One IPC round trip vs. N round trips |
| Directory existence check | Parsing `ls` output | `shell.exec('bash', ['-c', "test -d '${dir}' && echo exists || echo absent"])` | Clean boolean result; handles spaces in paths |
| Responsive variant detection | Custom filename parser | Regex `/(-p-\d+(?:x\d+)?(?:q\d+)?)(\.[^.]+)$/` | Covers all observed Webflow patterns; verified against actual zip |
| Video group detection | External metadata reader | String prefix matching on filename | No metadata needed; Webflow naming is consistent |
| Manifest storage | Runtime state / localStorage | Passed as return value from `copyAssets()` to `MainView` state | Single-session plugin; no persistence needed |

**Key insight:** The asset manifest is a pure data transformation of `ZipManifest.entries[]` — no filesystem reads beyond the initial copy. All the information needed to build the manifest (filenames, types, grouping) is available from the entry paths.

---

## Common Pitfalls

### Pitfall 1: fonts/ Directory May Not Exist

**What goes wrong:** `cp -r '${extractDir}/fonts/.'` fails with a non-zero exit code when the site uses only Google Fonts (no `fonts/` directory was created in the zip). The copy step throws, aborting the whole pipeline.

**Why it happens:** The Moneystack test zip has no `fonts/` directory. Every code path that only runs against the test zip will miss this case. The failure only surfaces when a real user has custom uploaded fonts.

**How to avoid:** Always check directory existence with `test -d` before attempting `cp -r`. If absent, skip silently (Google Fonts case). If present, copy and add entries to the manifest.

**Warning signs:** Copy code does not guard images/, videos/, fonts/ separately; no conditional existence check.

### Pitfall 2: Responsive Variants Listed Individually

**What goes wrong:** `buildManifest` maps every entry in `entries[]` to an `AssetEntry`. A site with 50 images and 5 responsive variants each produces 250+ manifest entries. The Phase 5 brief becomes enormous and confuses the coding agent.

**Why it happens:** It's the easiest first implementation — just `entries.map(e => ...)`. The grouping logic is not obvious and feels like premature optimization.

**How to avoid:** The grouping function (`groupResponsiveVariants`) MUST be implemented before the manifest is used. There is no acceptable "do it later" state — ASST-03 is a core requirement.

**Warning signs:** Manifest entry count equals the `images/` file count in the zip.

### Pitfall 3: Video Copy Timeout

**What goes wrong:** The default shell.exec timeout (120s) is insufficient for copying large `.mov` and `.webm` files. The Moneystack zip contains an 11MB `.mov` and multiple 3-4MB `.webm` files. Larger production sites can exceed 100MB in video assets. Copy fails with a timeout error.

**Why it happens:** The extraction step already has `{ timeout: 300000 }` but copy steps inherit the default.

**How to avoid:** Pass `{ timeout: 300000 }` to the `cp -r` shell.exec call for `videos/`. Progress label should say "Copying videos (may take a moment)..." to set user expectations.

### Pitfall 4: CSS/JS Included in Asset Manifest

**What goes wrong:** `entries[]` contains `css/normalize.css`, `css/components.css`, and `js/moneystack-website.js`. If the manifest builder iterates all non-directory entries, these appear in the manifest as assets. Phase 5 then includes them in the brief's asset table, creating confusion between "CSS files" and "images."

**Why it happens:** It's easy to filter only on `!entry.endsWith('/')` without also filtering by media type.

**How to avoid:** The manifest builder must only process entries in `images/`, `videos/`, and `fonts/` directories. CSS and JS are copied separately (as part of ASST-01 for completeness) but excluded from the `AssetManifest` type.

### Pitfall 5: Copying All Files Including CSS/JS — But Not Listing Them as Assets

**What goes wrong:** ASST-01 says "copy all media assets." The brief generator (Phase 5) also needs CSS files available at `.shipstudio/assets/css/`. If CSS copy is omitted because "CSS is not a media asset," Phase 5 has no CSS to reference.

**How to handle:** Copy CSS and JS alongside the media directories (same `copyAssets` function, just separate `cp -r` calls). But do NOT add CSS/JS entries to the `AssetManifest` returned to the caller — they're addressed in the brief via a `cssFiles` list, not the asset table.

### Pitfall 6: Manifest Paths Are Absolute Instead of Project-Relative

**What goes wrong:** `path` field in `AssetEntry` is set to the absolute filesystem path (`/Users/alice/myproject/.shipstudio/assets/images/hero.png`). The brief generator uses this path verbatim, leaking machine-specific paths into the brief.

**How to avoid:** All `path` values in `AssetEntry` must be project-relative: `.shipstudio/assets/images/hero.png`. The `assetsDir` passed to `buildManifest` is the absolute path but manifest entries must use `path.replace(projectPath + '/', '')` or equivalent.

---

## Code Examples

Verified patterns from existing codebase and direct inspection:

### AssetType and AssetEntry Type Definitions
```typescript
// src/assets/types.ts — new file this phase
export type AssetType = 'image' | 'video' | 'font' | 'svg' | 'animation';

export interface ImageEntry {
  filename: string;           // canonical base filename, e.g. "update-chart-1.png"
  path: string;               // project-relative, e.g. ".shipstudio/assets/images/update-chart-1.png"
  type: 'image' | 'svg' | 'animation';
  purpose: string;            // inferred: 'logo', 'favicon', 'placeholder', 'icon-or-graphic', 'image'
  variants?: string[];        // responsive suffixed filenames: ["update-chart-1-p-500.png", ...]
  referencingPages: string[]; // populated by Phase 4 HTML parsing; [] here
}

export interface VideoEntry {
  filename: string;           // source file: "viewsituation.mp4"
  path: string;               // project-relative: ".shipstudio/assets/videos/viewsituation.mp4"
  type: 'video';
  purpose: 'video';
  transcodes?: string[];      // ["viewsituation-transcode.mp4", "viewsituation-transcode.webm"]
  poster?: string;            // "viewsituation-poster-00001.jpg"
  referencingPages: string[]; // populated by Phase 4; [] here
}

export interface FontEntry {
  filename: string;           // "MyFont-Regular.woff2"
  path: string;               // ".shipstudio/assets/fonts/MyFont-Regular.woff2"
  type: 'font';
  purpose: 'font';
  referencingPages: string[]; // populated by Phase 4; [] here
}

export interface AssetManifest {
  images: ImageEntry[];
  videos: VideoEntry[];
  fonts: FontEntry[];
  cssFiles: string[];   // project-relative paths: [".shipstudio/assets/css/normalize.css", ...]
  totalCopied: number;  // count of all files actually copied (for progress display)
}
```

### copyAssets Entry Point
```typescript
// src/assets/copy.ts — top-level function called from MainView.tsx
import type { Shell } from '../types';
import type { AssetManifest } from './types';
import { buildManifest } from './manifest';

export async function copyAssets(
  shell: Shell,
  extractDir: string,        // e.g. "/proj/.shipstudio/tmp/moneystack-website"
  projectPath: string,       // e.g. "/proj"
  entries: string[],         // from ZipManifest.entries[]
  onProgress?: (label: string) => void,
): Promise<AssetManifest> {
  const assetsDir = `${projectPath}/.shipstudio/assets`;

  // 1. Ensure destination base exists
  await shell.exec('mkdir', ['-p', assetsDir]);

  // 2. Copy each media directory (guard with test -d first)
  await copyDirIfExists(shell, `${extractDir}/images`, `${assetsDir}/images`, 'Copying images...', onProgress);
  await copyDirIfExists(shell, `${extractDir}/videos`, `${assetsDir}/videos`, 'Copying videos (may take a moment)...', onProgress, 300000);
  await copyDirIfExists(shell, `${extractDir}/fonts`, `${assetsDir}/fonts`, 'Copying fonts...', onProgress);

  // 3. Copy CSS and JS for Phase 5 reference (not added to AssetManifest)
  await copyDirIfExists(shell, `${extractDir}/css`, `${assetsDir}/css`, 'Copying CSS...', onProgress);
  await copyDirIfExists(shell, `${extractDir}/js`, `${assetsDir}/js`, 'Copying JS...', onProgress);

  // 4. Build manifest in-process from entries[] (no additional shell reads)
  return buildManifest(entries, assetsDir, projectPath);
}
```

### Webflow Zip Layout — Confirmed From Direct Inspection
```
moneystack-website.webflow.zip structure:
  css/
    normalize.css
    components.css
    moneystack-website.css
  js/
    moneystack-website.js          ← Webflow runtime (jQuery 3.5.1 + IX2)
  images/
    update-chart-1.png             ← canonical image
    update-chart-1-p-500.png       ← responsive variant
    update-chart-1-p-800.png       ← responsive variant
    loading-p-130x130q80.jpeg      ← special: only variant exists, no canonical
    dylan.png + dylan-p-500.png    ← canonical + 1 variant
    aaa.png + aaa-p-500.png        ← canonical + 1 variant
    [SVGs, GIFs, etc.]
  videos/
    viewsituation.mp4              ← source
    viewsituation-transcode.mp4    ← H.264 transcode
    viewsituation-transcode.webm   ← VP9 transcode
    viewsituation-poster-00001.jpg ← thumbnail
    Moneystack-Fast-use---HD-720p.mov  ← original .mov source
    [+ 3 more video sets]
  index.html, 404.html, style-guide.html, ...
  detail_*.html                    ← CMS template pages (no real content)
  legal/
    terms-of-service.html
    privacy-policy.html
```

**Key observation:** `loading-p-130x130q80.jpeg` has no canonical `loading.jpeg` counterpart — the variant IS the only file. The grouping algorithm must handle this: when no canonical filename exists, use the variant filename itself as the entry's `filename` field (it's the only copy).

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Per-file cp loop | `cp -r` per directory | Reduces IPC round trips from ~50 to ~5 |
| Manifest built by rescanning dest dir | Manifest built from `entries[]` in-process | Eliminates post-copy shell reads |
| All image variants listed as entries | Variants grouped under base entry | 50 images show as 50, not 300+ |

**No deprecated patterns** — this is a new module with no migration concerns.

---

## Open Questions

1. **Phase reference population (`referencingPages`)**
   - What we know: ASST-02 requires "referencing page(s)" per asset; Phase 4 does HTML parsing
   - What's unclear: Whether Phase 3 should leave `referencingPages: []` for Phase 4 to fill in, or whether a lightweight pass over HTML `src=` attributes is acceptable here
   - Recommendation: Leave as `[]` in Phase 3. Phase 4 owns HTML parsing. The manifest type includes the field so Phase 4 can populate it when it iterates pages. This avoids duplicating HTML parsing logic.

2. **`loading-p-130x130q80.jpeg` — variant-only files**
   - What we know: The file exists in the zip with no matching canonical `loading.jpeg`
   - What's unclear: Whether this is a Webflow anomaly or a general pattern
   - Recommendation: When no canonical filename is found for a base name group, promote the lexicographically largest (by width) variant as the `filename`. All others become `variants[]`. This is robust to any variant-only situation.

3. **`detail_*.html` pages — should they influence asset manifest scope?**
   - What we know: CMS template pages contain `{{wf ...}}` placeholders, not real content; Phase 3 does not parse HTML
   - What's unclear: Whether assets referenced only in CMS templates should be marked differently
   - Recommendation: No — Phase 3 does not parse HTML. All assets get `referencingPages: []`. Phase 4 will distinguish CMS template page references.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (configured in `vitest.config.ts`) |
| Config file | `vitest.config.ts` — `include: ['src/**/*.test.ts']` |
| Quick run command | `npx vitest run src/assets/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASST-01 | `copyAssets` calls `cp -r` for each directory (images, videos, fonts, css, js) | unit | `npx vitest run src/assets/copy.test.ts` | ❌ Wave 0 |
| ASST-01 | `copyDirIfExists` skips gracefully when source dir absent (no fonts/) | unit | `npx vitest run src/assets/copy.test.ts` | ❌ Wave 0 |
| ASST-02 | `buildManifest` produces correct `path`, `type`, `purpose`, `referencingPages: []` fields | unit | `npx vitest run src/assets/manifest.test.ts` | ❌ Wave 0 |
| ASST-02 | `inferPurpose` returns correct purpose for logo, favicon, placeholder, SVG, GIF, image | unit | `npx vitest run src/assets/manifest.test.ts` | ❌ Wave 0 |
| ASST-03 | `groupResponsiveVariants` collapses `-p-500`, `-p-800`, `-p-130x130q80` into single entry with `variants[]` | unit | `npx vitest run src/assets/manifest.test.ts` | ❌ Wave 0 |
| ASST-03 | `groupResponsiveVariants` handles variant-only case (no canonical file) | unit | `npx vitest run src/assets/manifest.test.ts` | ❌ Wave 0 |
| ASST-03 | Image count for Moneystack zip entries produces 14 base entries (not 20 raw files) | unit | `npx vitest run src/assets/manifest.test.ts` | ❌ Wave 0 |
| ASST-01 | `ZipStep` union includes `'copying'` variant | unit | `npx vitest run src/zip/` | ❌ Wave 0 (types only) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/assets/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/assets/copy.test.ts` — covers ASST-01 (copy orchestration, directory-exists guard)
- [ ] `src/assets/manifest.test.ts` — covers ASST-02, ASST-03 (manifest building, grouping, purpose inference)

Mock Shell pattern is already established in `src/zip/discover.test.ts` and `src/zip/extract.test.ts` — reuse the `createMockShell()` pattern exactly.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `moneystack-website.webflow.zip` — confirmed directory layout, image variant naming patterns (`-p-500`, `-p-800`, `-p-130x130q80`), video variant naming (`-transcode`, `-poster-00001`), no `fonts/` directory present
- `src/zip/types.ts` — `ZipManifest` shape; `entries[]` is the input to manifest building
- `src/zip/extract.ts` — `extractAndVerify` return value; `buildExtractDir` path convention
- `src/zip/discover.ts` — `parseUnzipManifest`, established shell.exec patterns
- `src/views/MainView.tsx` — `ZipStep` state machine; integration point for 'copying' step
- `src/zip/discover.test.ts`, `src/zip/extract.test.ts` — Mock Shell test pattern to replicate
- `plugin-figma/src/assets/download.ts` — `prepareAssetsDir` pattern; `cp`/`mkdir` shell.exec idioms
- `plugin-figma/src/assets/sanitize.ts` — collision handling pattern (may be needed if filenames collide, LOW priority for this phase)
- `plugin-figma/src/brief/generate.ts` — `buildAssetsSection` shows how manifest feeds into brief markdown table
- `.planning/research/ARCHITECTURE.md` — data flow; `assets/copy.ts → assets/manifest.ts` pipeline; anti-patterns
- `.planning/research/PITFALLS.md` — Pitfall 3 (fonts not copied), Pitfall 5 (responsive variant inflation)

### Secondary (MEDIUM confidence)
- [Webflow Help: Responsive Images](https://help.webflow.com/hc/en-us/articles/33961378697107-Responsive-images) — Official confirmation of `-p-NNN` variant naming; 7 breakpoints (p-500 through p-3200)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies
- Architecture: HIGH — zip structure confirmed from direct inspection; patterns proven in existing phases and Figma sibling
- Pitfalls: HIGH — fonts gap and responsive variant inflation are explicitly documented in PITFALLS.md; video timeout confirmed from actual video file sizes in zip

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain — Webflow export format changes infrequently)
