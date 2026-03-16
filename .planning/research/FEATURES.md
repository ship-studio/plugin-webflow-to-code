# Feature Research

**Domain:** Webflow-to-Code migration plugin (brief generator for coding agents)
**Researched:** 2026-03-16
**Confidence:** HIGH (project requirements from PROJECT.md + sibling plugin source + ecosystem research)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| .zip file picker | Only practical input method for a Webflow export; drag-drop is a common alternative but file picker is the Ship Studio convention | LOW | Uses HTML `<input type="file">` in the plugin modal; mirrors sibling Figma plugin pattern |
| Zip extraction to temp location | Users expect all contents unpacked before any processing; nothing works without this | LOW | Via `shell.exec unzip`; output to a temp path under `.shipstudio/` |
| Copy all assets to `.shipstudio/assets/` | Standard Ship Studio convention; users expect assets to land in the same place as every other plugin produces them | LOW | Includes images (all responsive variants), SVGs, fonts, videos; copied as-is without optimization |
| Page discovery (all pages listed) | A site has multiple pages; users expect the tool to find all of them without manual specification | LOW | Walk HTML files in the zip root; extract title, route, and filename |
| CSS reference (point at original files) | Users expect the agent to know about the styles; re-extracting tokens would be lossy | LOW | Brief points the agent at the copied CSS files rather than re-parsing them; Webflow exports `normalize.css`, `webflow.css`, and a site-specific CSS file |
| `brief.md` output file | The whole point of the plugin; without this, there is nothing for the coding agent to act on | MEDIUM | Written to `.shipstudio/assets/brief.md` (mirroring sibling Figma plugin `brief.md` location pattern) |
| Mode selection (Pixel Perfect vs Best Site) | Defined in PROJECT.md as core UX; users have fundamentally different goals and need to declare intent before extraction begins | LOW | Two radio-card choices presented before the single "Get Brief" button; no post-hoc mode switching |
| Webflow component pattern recognition | Users expect the tool to understand what `.w-nav`, `.w-dropdown`, `.w-slider`, `.w-tab`, `.w-form`, `.w-lightbox` mean so the brief documents them correctly | MEDIUM | Parse HTML for known Webflow class prefixes; document the component type, DOM location, and equivalent native HTML/JS patterns in the brief |
| Page structural breakdown per page | Users expect the brief to give the agent a section-by-section view of each page, not just a raw HTML dump | MEDIUM | For each HTML page: extract major sections (nav, hero, feature sections, footer), note component patterns used, record approximate section count |
| Multi-session design in the brief | Users often have sites with 10–30+ pages; a single-session agent run is not realistic | MEDIUM | Brief includes a migration plan scaffold: ordered list of pages, a progress-tracking file spec, and instructions for the agent to resume across sessions |
| Asset manifest in brief | Users expect every asset to be accounted for so the agent can reference them by path | LOW | Table of all copied assets: path under `.shipstudio/assets/`, inferred purpose (hero image, logo, font, video), and the page(s) that reference it |
| Error handling for malformed zips | Users will accidentally select the wrong file or a partially-downloaded export; plugin must not silently fail | LOW | Detect missing `index.html`, corrupt zip, missing CSS files; show a clear error in the plugin UI |
| Progress feedback during extraction | ZIP processing + file copying can take 10–30 seconds for large sites; users need to know the plugin is working | LOW | Step-by-step status labels in the UI: "Extracting zip...", "Copying assets...", "Generating brief..." mirroring the Figma plugin's per-phase label approach |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Webflow-aware component semantic mapping | Most tools treat Webflow output as generic HTML; documenting what each `.w-*` class means (e.g., `.w-nav` = navigation bar with Webflow JS interactions, needs replacement with native `<nav>` + hamburger JS) gives the agent actionable migration guidance rather than raw DOM | HIGH | Build a static registry of known Webflow component classes → semantic description + migration note. Components include: `.w-nav`, `.w-dropdown`, `.w-slider`, `.w-tabs`, `.w-form`, `.w-lightbox`, `.w-embed`, `.w-button`, `.w-richtext` |
| Shared layout pattern extraction (nav/footer) | Detecting that the same nav and footer HTML appears across every page allows the brief to tell the agent "build this once as a shared component" — otherwise the agent might copy-paste the nav into every page file | MEDIUM | Cross-reference nav/footer HTML across all pages; if identical or near-identical, flag as "shared layout element" in the brief |
| Responsive image variant cataloguing | Webflow exports responsive images as `image-500.png`, `image-800.png`, `image-1080.png` etc. A naive tool just copies them all; a smarter tool groups them by base name in the asset manifest so the agent knows they are srcset variants of the same image | LOW | String-parse filenames; group by numeric suffix pattern; expose as grouped entries in the brief's asset table |
| CMS limitation disclosure | Webflow CMS pages do not export (they export as empty shells or static snapshots); users who don't know this will think the plugin missed content. Explicitly documenting CMS-backed pages in the brief prevents wasted agent effort | LOW | Detect pages with no body content or `data-wf-page` with CMS collection indicators; flag them in the brief with an explanation |
| JavaScript interaction inventory | Webflow's bundled `webflow.js` handles animations, scroll triggers, navbar open/close, form validation, lightboxes, and sliders. The brief should document which of these interactions are present so the agent knows what to replicate in JS or via a library | MEDIUM | Parse HTML for `data-ix` (interactions), `data-easing`, `data-animation` attributes and Webflow component classes; produce a "Interactions Present" section in the brief |
| Inspiration mode (third mode) | The sibling Figma plugin has a three-mode system: Best / Pixel / Inspiration. The Webflow plugin currently defines only two modes. Adding "Use as inspiration" (adapt the style to an existing codebase) provides a path for users who don't want a full migration but want to steal the visual patterns | MEDIUM | Mirrors Figma plugin's `inspiration` mode with optional free-text context field. Lowers bar for partial migrations. Note: PROJECT.md currently shows only two modes — treat as forward-looking differentiator |
| Token estimation in results UI | The Figma plugin shows "~12K tokens" in the results screen, which helps users understand brief size and whether their agent's context window can handle it in one session | LOW | Character count / 4 as a rough token estimate; display in results toast and summary panel, with a warning threshold (e.g., >12K tokens → suggest multi-session planning) |
| "Get Brief" single-button UX | Rather than a multi-step wizard, the entire pipeline (unzip → copy assets → analyze → generate brief) runs from one button after mode selection. Reduces cognitive overhead versus tools that present intermediate steps | LOW | Pipeline is sequential but appears as a single action to the user; mirrors Figma plugin's "Get Brief" button approach |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Actual code conversion (HTML → React/Next.js) | Users want the finished product, not a brief | The plugin runs in a sandboxed Ship Studio modal with no LLM API access, no Node.js runtime, and a small bundle budget; code conversion requires an LLM loop. Also, framework preferences vary wildly (Next.js, Astro, SvelteKit, plain HTML). Scope creep invalidates the architecture | The brief tells a coding agent to do the conversion; the agent has full LLM access and knows the user's framework from project context |
| Page selection UI (include/exclude pages) | Users with 30+ pages worry about brief size | Adding a checklist UI complicates the flow, the brief already supports multi-session planning for large sites, and selective migration is better managed by the agent (it can plan phase by phase). Filtering pre-extraction creates risk of the agent missing shared layout dependencies | The brief's multi-session scaffold lets the agent plan the migration order itself; the user guides it via chat, not checkboxes |
| Design token re-extraction from CSS | Users want a clean token table like the Figma plugin provides | Webflow CSS is generated and minified in structure; extracting colors, fonts, and spacing by parsing it is fragile and error-prone. The CSS files themselves are the canonical source; pointing the agent at them is safer and more complete | Brief references CSS files by path; brief includes a note explaining the CSS structure (normalize.css, webflow.css, site-specific CSS) |
| Framework-specific brief output (Next.js brief vs Astro brief) | Users want tailored output for their stack | Locking the brief to a framework reduces agent flexibility, requires the plugin to know which framework the project uses (not always knowable), and requires maintaining multiple brief templates. Agent-agnostic output has shipped successfully in the sibling Figma plugin | Agent-agnostic brief + instructions section that tells the agent to "adapt to the framework in this project"; the agent reads the project and adapts |
| Image optimization / transcoding | Users want optimized assets, not copies | Out of scope for a brief generator; adds significant complexity (Sharp, FFmpeg), large binary dependencies, and non-deterministic output. Users can run optimization post-migration | Assets are copied as-is; the brief notes that optimization should be done post-migration |
| CMS data export | Users want CMS collection items in the brief | Webflow CMS data is not included in the zip export (it would require the Webflow API, auth tokens, and pagination). Attempting to parse it from the static export will produce empty or stale data | Brief explicitly documents which pages appear to be CMS-backed and instructs the agent to either use placeholder data or connect to a CMS API |
| Drag-and-drop zip input | Feels more intuitive to some users | File picker is already consistent with Ship Studio modal patterns and the Figma plugin; adding drag-and-drop doubles the input handling surface area for minimal UX gain in a desktop app context | File picker with clear label and accepted file type (`.zip`) |
| Agent-specific brief variants (Claude brief vs Codex brief) | Users assume their agent needs a tailored format | The brief is structured markdown; all capable coding agents (Claude Code, Codex, Cursor, etc.) handle structured markdown well. Maintaining per-agent variants adds maintenance cost with no proven benefit | Single brief format; behavioral instructions section uses plain language that any agent interprets correctly |

---

## Feature Dependencies

```
[.zip file picker]
    └──requires──> [Zip extraction to temp location]
                       └──requires──> [Page discovery]
                       └──requires──> [CSS reference]
                       └──requires──> [Copy assets to .shipstudio/assets/]
                                          └──requires──> [Asset manifest in brief]

[Mode selection (Pixel Perfect / Best Site)]
    └──required-before──> [brief.md output]

[Page structural breakdown per page]
    └──requires──> [Page discovery]
    └──requires──> [Webflow component pattern recognition]
    └──enhances──> [brief.md output]

[Shared layout pattern extraction]
    └──requires──> [Page discovery]
    └──requires──> [Page structural breakdown per page]

[Responsive image variant cataloguing]
    └──requires──> [Copy assets to .shipstudio/assets/]
    └──enhances──> [Asset manifest in brief]

[JavaScript interaction inventory]
    └──requires──> [Page discovery]
    └──enhances──> [Webflow component pattern recognition]

[Multi-session design in the brief]
    └──requires──> [Page discovery]
    └──enhances──> [brief.md output]

[CMS limitation disclosure]
    └──requires──> [Page discovery]
    └──enhances──> [brief.md output]

[Token estimation in results UI]
    └──requires──> [brief.md output]
```

### Dependency Notes

- **Page discovery requires zip extraction:** The plugin cannot enumerate pages without a successfully unpacked zip.
- **Brief output requires mode selection:** Mode is chosen before extraction begins; the brief's instruction section is written differently per mode. Setting mode after extraction would require regenerating the entire brief.
- **Shared layout detection requires all pages to be discovered first:** The cross-page comparison that detects a shared nav/footer cannot run until all HTML pages are in memory. This means it runs as a post-parse pass, not per-page.
- **Webflow component recognition enhances page breakdown:** The structural breakdown section of the brief is more useful when component types (`.w-nav`, `.w-slider`, etc.) are identified and labeled semantically rather than just listed as class names.
- **Responsive image grouping enhances asset manifest:** The manifest is valid without grouping, but grouped entries make it substantially more useful to the coding agent.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept and deliver the "aha moment" from PROJECT.md.

- [ ] .zip file picker — entry point, nothing works without it
- [ ] Zip extraction via `shell.exec unzip` — prerequisite for all analysis
- [ ] Copy all assets to `.shipstudio/assets/` — images, fonts, videos, SVGs, CSS, JS
- [ ] Page discovery (all HTML files, titles, routes) — brief needs to know what pages exist
- [ ] CSS reference in brief (path to site CSS) — avoids fragile token re-extraction
- [ ] Mode selection UI (Pixel Perfect / Best Site) — core UX differentiator defined in requirements
- [ ] Page structural breakdown per page — gives agent the per-page section map it needs
- [ ] Webflow component pattern recognition (w-nav, w-dropdown, w-slider, w-tabs, w-form, w-lightbox, w-embed) — without this, the agent sees a generic HTML blob, not a Webflow site
- [ ] Multi-session brief scaffold — large sites (10+ pages) cannot be migrated in one agent session; the brief must be designed for resumability from day one
- [ ] Asset manifest in brief — complete list of copied assets with inferred purpose
- [ ] `brief.md` written to `.shipstudio/assets/` — the deliverable
- [ ] Progress feedback UI — extraction + copy + generation takes time; users need status labels
- [ ] Error handling for bad/missing zip — malformed input is common

### Add After Validation (v1.x)

Features to add once core brief generation is working.

- [ ] Shared layout pattern extraction (nav/footer deduplication) — trigger: user feedback that agents are copy-pasting nav into every page file
- [ ] Responsive image variant grouping in asset manifest — trigger: user feedback that agent is confused by `hero-800.png` vs `hero-1080.png`
- [ ] CMS limitation disclosure per page — trigger: user feedback that agent is trying to migrate empty CMS shell pages
- [ ] JavaScript interaction inventory — trigger: user feedback that agent is missing interactions (sliders don't work, forms not validated, navbar doesn't open on mobile)
- [ ] Token estimation in results UI — trigger: once brief sizes are measured in production; large sites may exceed agent context windows

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Inspiration mode (third mode) — defer until two-mode validation is complete; adds a third UX path and brief template; worth adding if users want partial migrations
- [ ] Webflow CMS export via Webflow API — requires OAuth flow and API key management; substantial architecture addition; defer until v1 validates demand
- [ ] Loom walkthrough video in plugin UI — sibling Figma plugin embeds a Loom; adds trust and reduces support burden; defer until brief format is stable enough to record a lasting video

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| .zip file picker | HIGH | LOW | P1 |
| Zip extraction | HIGH | LOW | P1 |
| Copy assets to `.shipstudio/assets/` | HIGH | LOW | P1 |
| Page discovery | HIGH | LOW | P1 |
| Mode selection UI | HIGH | LOW | P1 |
| brief.md output | HIGH | MEDIUM | P1 |
| Page structural breakdown | HIGH | MEDIUM | P1 |
| Webflow component pattern recognition | HIGH | MEDIUM | P1 |
| Multi-session brief scaffold | HIGH | MEDIUM | P1 |
| Asset manifest in brief | HIGH | LOW | P1 |
| CSS reference in brief | HIGH | LOW | P1 |
| Progress feedback UI | MEDIUM | LOW | P1 |
| Error handling for bad zip | MEDIUM | LOW | P1 |
| Shared layout detection (nav/footer) | HIGH | MEDIUM | P2 |
| Responsive image variant grouping | MEDIUM | LOW | P2 |
| CMS limitation disclosure | MEDIUM | LOW | P2 |
| JavaScript interaction inventory | HIGH | MEDIUM | P2 |
| Token estimation in results UI | MEDIUM | LOW | P2 |
| Inspiration mode (third mode) | MEDIUM | MEDIUM | P3 |
| Webflow CMS API export | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when core is stable
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Webflow Native Export | NoCodeExport / ExFlow | Udesly Adapter | Our Approach |
|---------|----------------------|----------------------|----------------|--------------|
| Export HTML/CSS/JS | Yes (paid plan required) | Yes (free) | No (converts to WordPress) | Input is the already-exported zip; we work with export output, not Webflow directly |
| CMS content | No | ExFlow handles CMS static snapshots | No | Explicitly discloses CMS gaps in brief; does not attempt CMS data |
| Brief for coding agent | No | No | No | Core differentiator — no competitor produces an agent brief |
| Multi-session planning | No | No | No | Built into brief scaffold from day one |
| Dual mode (pixel vs best) | No | No | No | Unique to this plugin; mode shapes agent behavioral instructions |
| Component semantic mapping | No | No | No | Webflow class registry mapped to semantic descriptions |
| Asset manifest | No | No | No | Complete manifest with inferred purpose per asset |
| Framework agnostic | N/A | N/A | WordPress only | Explicitly agent-agnostic; agent adapts to project framework |

---

## Sources

- Project requirements: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/.planning/PROJECT.md`
- Sibling Figma plugin source: `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/` (especially `brief/generate.ts`, `brief/types.ts`, `views/MainView.tsx`)
- [Webflow code export documentation](https://help.webflow.com/hc/en-us/articles/33961386739347-How-do-I-export-my-Webflow-site-code) — HIGH confidence (official)
- [Webflow export limitations (BRIX Templates)](https://brixtemplates.com/blog/can-you-export-a-webflow-website-understanding-code-export-limitations) — MEDIUM confidence (third-party, corroborated by official docs)
- [AI design-to-code tools 2026 (Banani)](https://www.banani.co/blog/ai-design-to-code-tools) — MEDIUM confidence (survey article)
- [How to write a good spec for AI agents (Addy Osmani)](https://addyosmani.com/blog/good-spec/) — HIGH confidence (expert practitioner)
- [Webflow export + AI rebuild walkthrough](https://legault.me/post/how-to-export-your-webflow-site-and-rebuild-it-with-ai-deploy-to-vercel) — MEDIUM confidence (practitioner write-up)
- [Context engineering for background coding agents (Spotify Engineering)](https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2) — HIGH confidence (production engineering blog)
- [Webflow CSS classes reference](https://css.timothyricks.com/webflow-classes) — MEDIUM confidence (community reference, corroborated by Webflow docs)
- [Pixel-perfect designs vs AI (DEV Community)](https://dev.to/rfornal/pixel-perfect-designs-versus-ai-278h) — LOW confidence (single source, informative context only)

---
*Feature research for: Webflow-to-Code Ship Studio plugin*
*Researched: 2026-03-16*
