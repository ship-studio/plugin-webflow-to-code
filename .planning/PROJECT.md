# Webflow to Code

## What This Is

A Ship Studio plugin that takes a Webflow site export (.zip) and prepares everything a coding agent (Claude Code, Codex, etc.) needs to recreate that site in the user's framework of choice — whether that's Next.js, Astro, plain HTML, or anything else. The plugin doesn't do the conversion itself; it extracts assets, documents the structure, and generates a comprehensive brief that guides the agent to produce a result that looks like the original Webflow site.

## Core Value

Users get the "aha moment" — after running the plugin and letting their coding agent work from the brief, they see something that looks almost exactly like their Webflow site, now living in real code in their own project.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can select a Webflow export .zip via file picker in the plugin modal
- [ ] Plugin extracts and processes all contents from the Webflow .zip (HTML pages, CSS, JS, images, videos, fonts)
- [ ] All media assets (images, SVGs, videos, fonts) are copied to `.shipstudio/assets/`
- [ ] All HTML pages from the export are included — no page filtering
- [ ] Plugin extracts page structure: list of pages, their routes, shared layout/nav/footer patterns
- [ ] Plugin extracts CSS reference: points the agent at the original CSS files rather than re-extracting tokens
- [ ] Plugin provides a page-by-page structural breakdown (HTML structure, key sections, component patterns)
- [ ] User chooses between two modes before extraction: "Pixel Perfect" (exact remake, highest fidelity) or "Best Site" (use export as a brief to build the best possible site)
- [ ] Plugin generates a `brief.md` tailored to the selected mode with clear behavioral instructions for the coding agent
- [ ] Brief is agent-agnostic — works with Claude Code, Codex, or any coding agent
- [ ] Brief is designed for multi-session migration: documents everything so the agent can plan, log progress, and pick up where it left off across sessions
- [ ] Brief documents all assets with their locations and purposes
- [ ] Plugin follows Ship Studio plugin conventions (toolbar slot, shell.exec for file ops, plugin context API, externalized React, committed dist/)

### Out of Scope

- Actual code conversion — the plugin prepares the brief, the coding agent does the work
- Framework detection or framework-specific output — the brief is framework-agnostic, the agent adapts
- Design token re-extraction from CSS — the raw CSS files serve as the reference
- Page filtering/selection UI — all pages are always included
- Agent-specific tailoring — brief stays universal
- Video transcoding or image optimization — assets are copied as-is

## Context

- Built on the Ship Studio plugin architecture (see plugin-starter repo)
- Follows patterns established by the Figma plugin (sibling project): file picker → extraction → brief generation → assets to `.shipstudio/assets/`
- Webflow exports contain: HTML pages, CSS (normalize + components + site-specific), bundled JS, images (with responsive variants), videos (MP4/WebM/MOV), and sometimes legal pages
- Webflow HTML uses specific class conventions (`.w-nav`, `.w-dropdown`, `.w-embed`, `.w-button`, `.w-form`, etc.) and data attributes (`data-wf-page`, `data-wf-site`)
- The brief must be comprehensive enough that an agent can work across multiple sessions without losing context
- Two distinct modes serve different user needs:
  - **Pixel Perfect**: emphasis on exact visual reproduction, fixed dimensions, preserving the Webflow layout precisely
  - **Best Site**: use the Webflow export as inspiration/reference to build the best possible production site with clean, semantic, responsive code

## Constraints

- **Plugin Architecture**: Must use Ship Studio plugin conventions — toolbar slot, React externalized via window globals, shell.exec for filesystem access, no direct FS or network APIs
- **No Build Step for Users**: dist/index.js must be committed to git — Ship Studio clones plugins without running build
- **File Access**: All file operations go through shell.exec (unzip, cp, cat, etc.)
- **Bundle Size**: Keep the plugin bundle small — loaded over IPC
- **Asset Storage**: Assets go to `.shipstudio/assets/` per Ship Studio convention

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| File picker input (not drag-drop) | Consistent with Ship Studio modal patterns, simpler implementation | — Pending |
| Mode selection before extraction | Brief is tailored from the start, no wasted processing | — Pending |
| All pages included, no filtering | Simplifies UX, the agent can handle selective migration via multi-session planning | — Pending |
| Agent-agnostic brief | Maximum compatibility, no lock-in to specific coding tools | — Pending |
| Raw CSS reference over token extraction | Webflow CSS is already well-structured; re-extracting adds complexity without clear benefit | — Pending |
| Copy all media including videos | Complete migration package, even if large — the agent needs everything available | — Pending |
| Multi-session design in brief | Users may have large sites that take multiple agent sessions to migrate | — Pending |

---
*Last updated: 2026-03-16 after initialization*
