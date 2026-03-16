# Pitfalls Research

**Domain:** Ship Studio plugin — Webflow export (.zip) processing and coding-agent brief generation
**Researched:** 2026-03-16
**Confidence:** HIGH — combined from direct Webflow zip inspection, community forum post-mortems, migration guides, and plugin architecture patterns already verified in STACK.md.

---

## Critical Pitfalls

### Pitfall 1: Brief Underestimates Webflow Interactions — Agent Rebuilds Nothing

**What goes wrong:**
The brief says "recreate the animations" but doesn't explain that Webflow's IX2 interaction system is entirely proprietary, ships as a bundled `webflow.js` runtime, and produces no exportable animation definitions. When the agent receives `{site-name}.js`, it finds minified, obfuscated interaction engine code — not declarative animation specs. The agent either ignores animations entirely or attempts to reverse-engineer the JS blob, producing a site that is visually static where the Webflow original was dynamic.

**Why it happens:**
Plugin builders assume the exported JS is analyzable. The exported `{site-name}.js` is the Webflow runtime bundled with jQuery 3.5.1 and the IX2 engine — not a list of animation definitions. There is no serialized "these elements animate this way" format in the export.

**How to avoid:**
The brief must explicitly call out the IX2 situation: name every `.w-nav`, `.w-dropdown`, `.w-slider`, `.w-tab` component found in the HTML, explain that these rely on JS interactions baked into `webflow.js`, and instruct the agent to replace them with native HTML/CSS equivalents (CSS transitions, `<details>`, `<dialog>`, IntersectionObserver scroll triggers) rather than attempt to use or port `webflow.js`. The brief should list interactive components as a discrete section: "Interactive Components Requiring Rebuild."

**Warning signs:**
- Brief mentions `{site-name}.js` without explaining its content
- Brief has no section on interactive components
- Brief says "the JS is included — use it" for interactions
- No mention of `.w-nav`, `.w-slider`, `.w-tab` in the component inventory

**Phase to address:** Brief generation (the phase that defines `brief/generate.ts`)

---

### Pitfall 2: CMS Template Pages Treated as Real Pages

**What goes wrong:**
The plugin includes `detail_*.html` files (Webflow CMS template pages) in the page inventory and the brief describes them as pages to migrate. The agent builds a static `/blog/[slug]` route that renders the same empty template for every post, or worse, asks why there's no content to fill it with. The user gets a migration that's 80% done but the most critical dynamic pages are empty shells.

**Why it happens:**
Webflow exports one HTML template per CMS Collection, not one page per item. The export file `detail_blog-post.html` contains `{{wf {&quot;path&quot;:&quot;name&quot;,&quot;type&quot;:&quot;PlainText&quot;}}}` CMS binding placeholders — not real content. These placeholders appear as literal text in the rendered HTML. A naïve file scanner counts `detail_blog-post.html` as a page and the brief describes it as if it has content.

**How to avoid:**
The parser must distinguish static pages from CMS template pages. Detection heuristic: filename starts with `detail_` OR the HTML contains `{{wf ` placeholder strings OR the HTML `<title>` contains CMS field binding syntax. For template pages, the brief must: (1) clearly label them as "CMS Templates — no content exported," (2) document the template structure so the agent can build the correct dynamic route, and (3) explicitly instruct the agent to source content from the Webflow CMS API or a placeholder content strategy. The brief should never imply a CMS template page contains real content.

**Warning signs:**
- Page inventory treats `detail_*.html` identically to `index.html`
- No mention of "CMS template" or "dynamic route" in page descriptions
- Brief page count matches HTML file count exactly with no caveat
- `{{wf` strings appear in brief excerpts

**Phase to address:** HTML parsing (the phase that defines `parse/pages.ts`)

---

### Pitfall 3: Fonts Not Copied — Agent References Missing Files

**What goes wrong:**
The asset copy step includes `images/` and `videos/` but misses fonts. Custom fonts uploaded to Webflow may be referenced in `{site-name}.css` via `@font-face` declarations pointing to relative paths like `../fonts/MyFont.woff2`. If the fonts directory isn't copied to `.shipstudio/assets/`, those paths are dead. Google Fonts loaded via the WebFont.js script tag work fine; custom-uploaded fonts do not. The agent's output either falls back to system fonts silently or breaks with 404s.

**Why it happens:**
Not all Webflow exports contain a `fonts/` directory — it depends on whether the site uses custom uploaded fonts vs. Google Fonts. When testing with a site that only uses Google Fonts (like the Moneystack zip), this path is never exercised, so the absence of font copying goes unnoticed until a user with custom fonts runs the plugin.

**How to avoid:**
The asset copy step must check for a `fonts/` directory in the extracted zip and copy it if present. The brief must include a "Typography" section that distinguishes: (1) Google Fonts loaded via WebFont.js script tag — specify the family names and weights found in the `<head>` script for the agent to implement via `<link>` or `@import`, and (2) custom font files — list each `@font-face` declaration found in the CSS and confirm the files are in `.shipstudio/assets/fonts/`.

**Warning signs:**
- Asset copy code only handles `images/` and `videos/`
- Brief typography section only mentions font names, not sources
- No check for `fonts/` directory existence before copying
- Test suite only uses the Moneystack zip (Google Fonts only)

**Phase to address:** Asset extraction (the phase that defines `assets/copy.ts`) and brief generation

---

### Pitfall 4: Brief Context Overload Kills Multi-Session Continuity

**What goes wrong:**
The brief is generated as a single massive markdown document. A large Webflow site (20+ pages, 35+ MB zip, extensive component inventory) produces a brief that exceeds the coding agent's context window on first load. The agent processes what fits, discards the rest, and begins building. In session two, the agent has no structured record of what was completed — it starts guessing, duplicating work, or contradicting session one's decisions. The multi-session migration collapses.

**Why it happens:**
Brief generation is treated as "output everything we know." There's no consideration for the agent's context window limits or for how the agent will track its own progress. The brief is designed to be written once and read linearly, not to support iterative pickup.

**How to avoid:**
The brief must have a two-tier structure: a **Planning Document** (the comprehensive analysis) and a **Session Tracker** (a checklist the agent updates at the end of each session). The Planning Document should be organized so the agent can load only the relevant section for the current session's scope. Instruct the agent explicitly: "Begin by reading only the Overview and the Session Tracker. Work on one phase at a time. Update the Session Tracker before ending each session." Keep individual page analysis sections skimmable — the agent doesn't need to read all 20 page analyses before starting page 1. Include a CLAUDE.md excerpt in the brief instructing the agent to maintain a `MIGRATION_LOG.md` in the project root.

**Warning signs:**
- Brief has no progress tracking section
- Brief doesn't mention multi-session workflow
- Brief generates a single flat list of all pages with full analysis for each
- No instruction for the agent on what to read first vs. reference later

**Phase to address:** Brief generation (the phase that defines `brief/generate.ts` and the brief template)

---

### Pitfall 5: Responsive Image Variants Confuse Asset Inventory

**What goes wrong:**
Webflow generates responsive variants for every image: `hero-image.jpg`, `hero-image-p-500.jpg`, `hero-image-p-800.jpg`, `hero-image-p-1080.jpg`, `hero-image-p-1600.jpg`, `hero-image-p-2000.jpg`. The brief's asset inventory lists all of these as distinct assets. The agent receives a list of 300 "images" when there are actually 50 unique images with up to 6 size variants each. The agent either references the wrong variant, reconstructs `srcset` incorrectly, or is confused about which file is the "real" image.

**Why it happens:**
The asset scanner iterates the `images/` directory and lists every file. The `-p-500`, `-p-800` naming pattern is Webflow-specific and not immediately obvious as a variant system unless explicitly handled.

**How to avoid:**
The asset catalog must group responsive variants under their canonical image. Detection: strip `-p-[0-9]+` suffixes from filenames to find the base name, then group all files sharing a base name as "one image with N variants." The brief should present: "50 images (with responsive variants)" and list only base filenames, noting "variants available: -p-500, -p-800 etc." For the pixel-perfect brief, include the full `srcset` reconstruction instructions. For the best-site brief, tell the agent to use only the largest available variant and implement its own responsive image strategy.

**Warning signs:**
- Asset inventory lists 300+ images when the site has ~50 visuals
- No mention of `-p-500`/`-p-800` naming convention in brief
- Brief treats `hero-image-p-500.jpg` as a distinct asset from `hero-image.jpg`
- Image count in brief is suspiciously high

**Phase to address:** HTML/asset parsing (the phase that defines `parse/assets.ts`)

---

### Pitfall 6: Mode Distinction Collapses — Brief Serves Neither Goal

**What goes wrong:**
Pixel Perfect and Best Site modes produce briefs that differ only in a header line. The agent receives identical structural analysis with a mode label it doesn't know what to do with. Pixel Perfect users get a site that doesn't look like the original because the agent chose semantic HTML over fidelity. Best Site users get a site that unnecessarily preserves Webflow's `.w-nav` class names because the brief didn't explicitly permit cleanup.

**Why it happens:**
Brief generation logic is written once, then mode is appended as a label. The behavioral difference between modes — what the agent must preserve vs. what it may improve — is never made explicit in the brief content itself.

**How to avoid:**
The brief must contain mode-specific behavioral instructions as unambiguous directives, not labels. Pixel Perfect brief must say: "Preserve all class names exactly as they appear in the Webflow HTML. Do not rename `.w-nav` to `<nav>`. Copy the three CSS files (normalize.css, components.css, `{site-name}.css`) into the project and import them in this order. Match spacing, color values, and layout structure to the exported HTML." Best Site brief must say: "You may rewrite HTML structure using semantic elements. Replace `.w-nav` with `<nav>`. Replace `.w-button` with `<button>`. You may replace Webflow CSS with Tailwind or your preferred utility classes. Match the visual design but optimize code quality."

**Warning signs:**
- `brief/generate.ts` has a single code path with a mode flag added at the top
- Brief contains "Mode: Pixel Perfect" header but no mode-specific instructions in the body
- Brief uses identical component descriptions regardless of mode
- No explicit list of "what to preserve" vs "what to improve" per mode

**Phase to address:** Brief generation (the phase that defines `brief/generate.ts` and mode differentiation)

---

### Pitfall 7: Zip Extraction Fails Silently on Large or Unusual Exports

**What goes wrong:**
The plugin calls `shell.exec('unzip', ['-o', zipPath, '-d', tmpDir])` and assumes success if exit code is 0. For large exports (35+ MB with video files), extraction may partially complete before a timeout. For exports containing Unicode filenames (non-ASCII characters in image names), `unzip` on macOS may error on specific files while succeeding on others — returning exit code 1 but having extracted most files. The plugin either reports success with missing assets or crashes with an unhelpful error.

**Why it happens:**
Webflow exports vary widely. The test zip (Moneystack, ~66 files) is well-behaved. Real-world exports include video-heavy sites, client uploads with Spanish/French/Japanese filenames, and sites with large PDFs. None of these edge cases are caught by testing against a single sample zip.

**How to avoid:**
After extraction, verify the extracted file count matches the count from `unzip -l`. If they differ, report which files are missing (compare lists). Pass `{ timeout: 300000 }` (5 minutes) for the unzip step specifically — not the default 120s. For Unicode filename errors: wrap the unzip in a bash script that uses `unzip -O UTF-8` flag on macOS where supported. Surface partial extraction as a warning in the UI: "Extraction completed with warnings — N files could not be extracted."

**Warning signs:**
- Unzip step uses default timeout (120s)
- No post-extraction file count verification
- Error handling only checks `exit_code === 0`
- Plugin shows success even when `stderr` is non-empty

**Phase to address:** Zip extraction (the phase that defines `zip/extract.ts`)

---

### Pitfall 8: brief.md Breaks on Markdown Metacharacters in Webflow Content

**What goes wrong:**
Page titles, section headings, and component class names scraped from the Webflow HTML are interpolated directly into the markdown brief. When a Webflow site has pages with titles like "Pricing | 50% Off — Black Friday" or class names containing backticks, pipes, or angle brackets, the generated markdown is malformed. Code fences break. Tables render incorrectly. The agent parses corrupted brief content and produces wrong output.

**Why it happens:**
The naive brief generator uses template literals: `## ${page.title}` — without sanitizing content extracted from the Webflow HTML. This is a known shell/markdown injection hazard when mixing external content into structured text. The base64 write pattern (from the Figma plugin's `io.ts`) solves the *file writing* side but not the markdown *structure* side.

**How to avoid:**
Sanitize all Webflow-derived strings before inserting into the brief: (1) escape pipe characters in table cells (`|` → `\|`), (2) wrap class name lists in code fences, (3) HTML-encode page titles used in headings if they contain special markdown characters, (4) never interpolate CSS selector strings directly into prose — always put them in code blocks. Add a unit test to `brief/generate.ts` that uses adversarial inputs: page titles with pipes, backticks, angle brackets.

**Warning signs:**
- No escaping logic in `brief/generate.ts`
- Unit tests only use clean, ASCII page titles
- Brief generation never wraps class names in backticks
- Table sections are generated with raw string interpolation

**Phase to address:** Brief generation — markdown safety

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single-file brief (all pages in one document) | Simple to generate, easy to review | Exceeds agent context window on large sites; no progress tracking structure | Never for sites with >10 pages; acceptable for MVP testing only |
| Trusting `exit_code === 0` as extraction success | Simple error handling | Silent partial extractions mislead users; assets appear missing post-conversion | Never — always verify file count |
| Listing all responsive variants as separate assets | No parsing logic needed | Confuses agent with 5-6x inflated asset counts; `srcset` reconstruction instructions become unclear | Never — group variants at parse time |
| Copying `webflow.js` to assets and referencing it in brief | Agent has the JS available | Agent may attempt to use Webflow runtime in target framework, causing subtle breakage | Never — the brief should explicitly deprecate `webflow.js` |
| Skipping `fonts/` directory check (testing with Google Fonts site only) | Works for most test cases | Breaks every user who uploaded custom fonts to Webflow | Never in production — add the check before first ship |
| Same brief format for both modes | One code path to maintain | Mode-specific guidance is absent; both modes produce mediocre results | Never — mode differentiation is core product value |
| Including raw `{{wf ...}}` CMS placeholders in page analysis | Preserves raw Webflow output | Agent treats placeholders as content; brief descriptions are misleading | Never — strip or annotate CMS placeholders explicitly |

---

## Integration Gotchas

Common mistakes when connecting to external services or platform dependencies.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Webflow WebFont.js | Copying the `<script>` tag into the brief and telling agent to include it | Extract font family names and weights from the WebFont.load() call; brief should specify the fonts as a typography requirement, not as a script dependency to preserve |
| Google Fonts (via WebFont.js) | Assuming the export contains font files because fonts are referenced | Google Fonts load from Google's CDN via the WebFont.js script — no font files in the zip; agent needs to add `<link>` tags or equivalent |
| Webflow Forms (`w-form` class) | Including the Webflow form HTML verbatim in the brief with no annotation | Mark every `.w-form` component: "This form requires a replacement backend. Webflow's form handler does not work off Webflow hosting. Use Resend, Formspree, or Next.js server actions." |
| Videos (`*-transcode.*` variants) | Copying all transcode variants and referencing them all in the brief | Brief should reference the original source video and note transcode variants are available; agent should decide whether to use Webflow's encoding or re-transcode |
| OG/meta images | Including the exported page `<head>` verbatim which may reference Webflow CDN URLs | Check for absolute Webflow CDN URLs (`https://uploads-ssl.webflow.com/`) in `<head>` meta tags; these break when Webflow hosting is removed; flag them explicitly in the brief |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reading all HTML pages sequentially with `cat` | 15+ second processing time for 25-page sites | Use `shell.exec('bash', ['-c', 'for f in ...'])` batch reads, or accept the latency and show per-page progress | 20+ page sites (~300ms per `shell.exec` call) |
| Copying `videos/` with default 120s timeout | User sees timeout error on video-heavy sites; extraction appears to fail | Pass `{ timeout: 300000 }` for video copy step; display "Copying large files…" progress message | Any site with video files >50MB total |
| Generating the full brief before showing any UI feedback | Plugin appears frozen during processing | Show step-by-step progress: "Extracting zip… Analyzing pages… Generating brief…" — update state after each `shell.exec` call | All sites with >5 HTML pages |
| `unzip -l` output parsing with string splitting | Breaks on filenames with spaces (e.g., "My Image.jpg") | Parse `unzip -l` output using column widths (size at char 0-12, date/time at 12-32, filename at 32+) not just `.split(' ')` | Any site with spaced filenames in assets |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Unzipping user-provided zip to an unverified path | Zip slip attack — crafted zip with `../` paths overwrites project files | Verify extracted file paths don't escape `tmpDir`; use `unzip -j` to flatten, or check each extracted path against the expected base directory |
| Using the zip file path directly in shell commands without quoting | Path injection if the zip file is in a directory with spaces or special chars | Always wrap user-supplied paths in single quotes in shell commands: `unzip -o '${zipPath}' -d '${tmpDir}'` |
| Including file system paths in the generated brief | Brief leaks machine paths like `/Users/username/.shipstudio/...` | Use project-relative paths in the brief: `.shipstudio/assets/images/hero.jpg` not the absolute system path |
| Executing content extracted from the Webflow zip | If a malicious zip contains executable scripts that are inadvertently `cat`-executed | Only `cat` known file types (`.html`, `.css`, `.js`). Never use `shell.exec` to run extracted content. |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Plugin completes but brief is not visible or easy to access | User doesn't know what was generated or where to find it | Show the brief path prominently in the Done view; include a "Copy Brief" button so the agent can receive it immediately via clipboard |
| Processing spinner with no progress detail | Large zips (35MB+) take 30-60s; users think plugin crashed | Named progress steps: "1/4 Extracting zip", "2/4 Analyzing pages", "3/4 Copying assets", "4/4 Writing brief" |
| Mode selection after the fact | User selects "Pixel Perfect" expecting fidelity; discovers the brief was for "Best Site" | Mode selection must happen before extraction begins; the selected mode must be prominently displayed in the Done view and embedded in the brief header |
| No validation of the zip before extraction | User accidentally selects a non-Webflow zip (e.g., their downloads folder has other zips); plugin produces garbage brief | Check for `index.html` at root and either a CSS file or `webflow.js` before proceeding; show a clear error: "This doesn't appear to be a Webflow export" |
| Brief references assets that weren't in the zip | Agent looks for `hero-p-800.jpg` that didn't survive extraction | Asset manifest in brief must only list files that were successfully copied to `.shipstudio/assets/` — verify with `test -f` after copy |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **CMS Pages:** Plugin shows page count — verify `detail_*.html` files are flagged as CMS templates, not counted as static pages with content
- [ ] **Custom Fonts:** Brief mentions typography — verify `fonts/` directory was checked and either copied or flagged as absent (Google Fonts only)
- [ ] **Interactions:** Brief describes components — verify every `.w-nav`, `.w-slider`, `.w-tab`, `.w-dropdown`, `.w-lightbox` is in the "Interactive Components Requiring Rebuild" section
- [ ] **Mode Differentiation:** Two modes are selectable — verify the generated brief body has mode-specific behavioral instructions, not just a mode label in the header
- [ ] **Responsive Variants:** Image section lists assets — verify image count groups variants (50 images, not 300+ files)
- [ ] **Form Handling:** Forms appear in the component list — verify every `.w-form` instance is annotated with "requires backend replacement"
- [ ] **OG Meta Images:** `<head>` tags are analyzed — verify any absolute `https://uploads-ssl.webflow.com/` URLs in meta tags are flagged
- [ ] **Webflow.js:** JS file is copied to assets — verify brief explicitly tells agent NOT to use `webflow.js` and explains what it contains
- [ ] **Extraction Completeness:** Extraction shows success — verify file count from `unzip -l` matches extracted file count
- [ ] **Multi-Session Structure:** Brief is generated — verify brief contains a Session Tracker section and MIGRATION_LOG.md instructions

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Brief missing interaction documentation | MEDIUM | Re-run plugin (fast, no data loss); add interaction inventory to parse pass |
| CMS templates treated as static pages | MEDIUM | Re-run plugin after fixing `parse/pages.ts`; no asset re-copy needed |
| Fonts missing from assets | LOW | User manually copies `fonts/` directory from unzipped export to `.shipstudio/assets/fonts/`; add to checklist |
| Brief too large for agent context window | HIGH | Requires brief restructuring into Planning Doc + Session Tracker; affects all sites once discovered |
| Extraction timeout on large videos | LOW | User increases timeout via config; or splits asset copy into separate steps |
| Agent misused `webflow.js` in output | HIGH (agent output) | Brief must be regenerated with explicit deprecation of `webflow.js`; agent output must be discarded and restarted |
| Malformed markdown in brief | MEDIUM | Fix escaping in `brief/generate.ts`; re-run plugin to regenerate |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| IX2 interactions not documented | Brief generation — component inventory section | Check that brief contains "Interactive Components" section listing `.w-nav`, `.w-slider`, etc. |
| CMS template pages misidentified | HTML parsing — `parse/pages.ts` | Confirm `detail_*.html` files labeled "CMS Template" in page list |
| Custom fonts not copied | Asset extraction — `assets/copy.ts` | Run plugin against a zip with `fonts/` directory; verify `.shipstudio/assets/fonts/` is populated |
| Multi-session brief structure | Brief generation — brief template design | Verify brief has Session Tracker section and phase-by-page structure |
| Responsive image variant confusion | Asset parsing — `parse/assets.ts` | Verify image count in brief matches unique base images, not all file variants |
| Mode behavioral instructions absent | Brief generation — mode differentiation | Verify Pixel Perfect and Best Site briefs contain different behavioral directives in body |
| Zip extraction silent failure | Zip extraction — `zip/extract.ts` | Run with a deliberately corrupt zip; verify error surfaces with detail |
| Markdown injection from Webflow content | Brief generation — sanitization | Unit test with page titles containing `|`, backticks, `<>` |
| Font loading method confusion | Brief generation — typography section | Verify brief distinguishes Google Fonts (WebFont.js) from custom font files |
| OG meta absolute URLs | HTML parsing — `<head>` analysis | Verify brief flags `uploads-ssl.webflow.com` URLs in meta tags |

---

## Sources

- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/moneystack-website.webflow.zip` — Direct inspection of actual Webflow export. Confirmed: `detail_*.html` CMS templates, `*-p-500.jpg` responsive variant naming, `webflow.js` bundled runtime, WebFont.js Google Fonts loading pattern, `videos/` with transcode variants. **HIGH confidence.**
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/.planning/research/STACK.md` — Implementation patterns already verified; timeout values and shell.exec constraints inform several pitfalls. **HIGH confidence.**
- [Webflow Forum: Interactions/Animations not working in exported code](https://discourse.webflow.com/t/interactions-animations-not-working-in-exported-code/91517) — Community confirmation that IX2 does not survive export. MEDIUM confidence (forum, not official docs).
- [DEV.to: How I Built a Website Code Exporter That Handles Framer Animations, Webflow IX2](https://dev.to/nocodeexport/how-i-built-a-website-code-exporter-that-handles-framer-animations-webflow-ix2-and-wixs-3mb-4dap) — Confirms IX2 is "well-architected as a self-contained module" that "only initializes once on page load." MEDIUM confidence.
- [BrowserCat: Migrate Your Webflow Site to Next.js](https://www.browsercat.com/post/migrate-webflow-to-nextjs) — Practical migration guide confirming CMS data strip, interaction loss, image download complexity. MEDIUM confidence.
- [BrowserCat: Migrate Your Webflow Site to Raw Code](https://www.browsercat.com/post/migrate-webflow-to-code) — "monolithic webflow.css 200KB+", CMS complete strip on export. MEDIUM confidence.
- [Webflow Help: Responsive Images](https://help.webflow.com/hc/en-us/articles/33961378697107-Responsive-images) — Official confirmation of 7-variant naming system (p-500 through p-3200). HIGH confidence.
- [Webflow Forum: Custom fonts missing when exporting code](https://discourse.webflow.com/t/custom-fonts-missing-when-exporting-code/147074) — Known issue: custom fonts may not export correctly; WOFF2 preferred. MEDIUM confidence.
- [Webflow Wishlist: Code export yields incorrect link to OG images](https://wishlist.webflow.com/ideas/WEBFLOW-I-4253) — Confirms OG image absolute URL breakage after export. MEDIUM confidence.
- [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Agent context window management; brief structure for multi-session continuity. HIGH confidence.
- [CleanAim: Context Loss: Why Your AI Coding Agent Forgets](https://cleanaim.com/silent-wiring/problems/context-loss/) — Confirms agents start from zero each session; CLAUDE.md as persistent context. MEDIUM confidence.
- [Webflow Help: Custom Code Embed](https://help.webflow.com/hc/en-us/articles/33961332238611-Custom-code-embed) — Confirms jQuery 3.5.1 bundled in webflow.js; custom code embed limitations. HIGH confidence.

---
*Pitfalls research for: Ship Studio plugin — Webflow export processing and coding-agent brief generation*
*Researched: 2026-03-16*
