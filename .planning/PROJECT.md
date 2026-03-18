# Webflow to Code

## What This Is

A Ship Studio plugin that takes a Webflow site export (.zip) and helps users migrate it to real code using any coding agent. The plugin extracts assets, analyzes page structure, generates a migration brief, and then tracks the agent's progress as it builds the site — showing live per-page, per-section status in the plugin UI. Users can pause and resume across multiple agent sessions.

## Core Value

Users get the "aha moment" — after running the plugin and letting their coding agent work from the brief, they see something that looks almost exactly like their Webflow site, now living in real code in their own project.

## Requirements

### Validated

- ✓ User can select a Webflow export .zip via native macOS file picker — v1.0
- ✓ Plugin extracts and processes all contents from the Webflow .zip — v1.0
- ✓ All media assets (images, SVGs, videos, fonts) copied to `.shipstudio/assets/` — v1.0
- ✓ All HTML pages included with no filtering — v1.0
- ✓ Plugin extracts page structure: pages, routes, shared layout/nav/footer patterns — v1.0
- ✓ CSS referenced by path (not re-extracted as tokens) — v1.0
- ✓ Per-page structural breakdown (sections, components) — v1.0
- ✓ Two modes: "Pixel Perfect" and "Best Site" with mode-specific instructions — v1.0
- ✓ Agent-agnostic brief.md with behavioral instructions — v1.0
- ✓ Multi-session migration design (Session Tracker + MIGRATION_LOG.md format) — v1.0
- ✓ Brief documents all assets with paths and purposes — v1.0
- ✓ Plugin follows Ship Studio conventions (toolbar slot, externalized React, committed dist/) — v1.0

### Active

- [ ] Brief instructs agent to create a structured migration plan as first step
- [ ] Migration plan stored as `.shipstudio/migration-plan.json` with defined schema
- [ ] Plugin UI shows live migration progress (expandable per-page, per-section)
- [ ] Plugin polls plan file every 30s to detect updates
- [ ] "Waiting for plan" state shown after brief is copied, before plan file exists
- [ ] "Continue Migration" button copies a prompt for resuming in a new agent session
- [ ] Best Site mode includes preserve options checklist and custom instructions
- [ ] Results panel redesign (success state, multi-session tip for large sites)

### Out of Scope

- Actual code conversion — the plugin prepares the brief, the coding agent does the work
- Framework detection or framework-specific output — brief is framework-agnostic
- Design token re-extraction from CSS — raw CSS files serve as reference
- Page filtering/selection UI — all pages always included
- Agent-specific tailoring — brief stays universal
- Video transcoding or image optimization — assets copied as-is
- Inspiration mode (third mode) — deferred to future
- Webflow CMS data export via API — requires OAuth, deferred to v2.0
- Agent orchestration — plugin observes, doesn't drive the coding agent
- Framework-specific plan steps — plan is framework-agnostic like the brief

## Context

Shipped v1.0 with 3,755 LOC TypeScript across 20 source files.
Tech stack: React 19 (externalized), Vite 6, TypeScript 5.6, vitest.
Plugin bundle: 48KB (dist/index.js).
Native macOS file picker via osascript (Tauri WebView doesn't expose filesystem paths from `<input type="file">`).
DOMParser (browser API) for HTML analysis.
145 unit tests covering extraction, validation, manifest building, page analysis, brief generation.

## Constraints

- **Plugin Architecture**: Ship Studio conventions — toolbar slot, React externalized via window globals, shell.exec for filesystem access
- **No Build Step for Users**: dist/index.js committed to git
- **File Access**: All file operations through shell.exec
- **macOS Only**: osascript file picker is macOS-specific
- **Asset Storage**: Assets go to `.shipstudio/assets/`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| osascript for file picker (not HTML input) | Tauri WebView doesn't expose filesystem paths from `<input type="file">` | ✓ Good — works reliably |
| Mode selection before extraction | Brief tailored from the start | ✓ Good |
| All pages included, no filtering | Agent manages migration order via Session Tracker | ✓ Good |
| Agent-agnostic brief | Maximum compatibility | ✓ Good |
| Raw CSS reference over token extraction | Webflow CSS is already well-structured | ✓ Good |
| Copy all media including videos | Complete migration package | ✓ Good |
| DOMParser for HTML analysis | Zero-cost browser API, handles Webflow HTML correctly | ✓ Good |
| data-w-id for shared layout detection | Byte-identical UUIDs across pages — reliable signal | ✓ Good |
| Three CMS detection signals | detail_ prefix, w-dyn-bind-empty, title starting with pipe | ✓ Good |
| base64 encoding for brief file write | Avoids shell metacharacter issues in markdown content | ✓ Good |
| btn-primary host class (not custom) | Custom CSS caused white-on-white text; host class has correct theme colors | ✓ Good — learned from Phase 1 bug |

## Current Milestone: v1.1 Migration Tracker

**Goal:** Evolve the plugin from a brief generator into an end-to-end migration helper with live progress tracking.

**Target features:**
- Migration plan JSON schema and brief instructions for agents to create it
- Live progress UI (expandable per-page, per-section view)
- Continue Migration prompt for multi-session handoff
- Best Site preserve options (already shipped pre-milestone)
- Results panel UX improvements (already shipped pre-milestone)

---
*Last updated: 2026-03-18 after v1.1 milestone start*
