# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-16
**Phases:** 5 | **Plans:** 10 | **Sessions:** 1

### What Was Built
- Ship Studio plugin with Webflow branding and native macOS file picker
- Zip extraction with Webflow signature validation and file count verification
- Asset pipeline with responsive image grouping and video transcode cataloguing
- DOMParser-based HTML analysis — page structure, 10-entry Webflow component registry, shared layout detection via data-w-id, CMS template flagging (3 signals)
- Mode-aware brief generator (Pixel Perfect / Best Site) with 8-section markdown output and multi-session Session Tracker

### What Worked
- TDD pattern for pure logic modules (manifest, analysis, brief) — caught the directory-entry count bug early and kept all 145 tests green throughout
- Sibling plugin references (Figma plugin) eliminated most design decisions — proven patterns for Modal, context hook, styles, base64 file I/O
- osascript file picker discovery in research phase saved implementation time — the `<input type="file">` dead end was caught before any code was written
- Pre-creating directory structure in Phase 1 gave every subsequent phase a clear home

### What Was Inefficient
- Phase 1 CSS fix (btn-primary) required a mid-checkpoint bug fix — custom button CSS should have used host classes from the start
- Phase 2 file count mismatch (directories counted in manifest) required a fix during the checkpoint — the test mocks didn't match real unzip behavior
- Plan checker index parser misread 04-03's wave assignment (showed wave 1 instead of wave 3) — required manual wave ordering in orchestrator

### Patterns Established
- `btn-primary` host class for buttons (never custom button CSS)
- osascript via shell.exec for native file dialogs in Ship Studio plugins
- base64 encoding for writing markdown files via shell.exec
- `// @vitest-environment jsdom` header for DOMParser tests
- `wf2c-` CSS prefix for all plugin-scoped styles
- Pure function pattern for generation logic (no side effects, testable in isolation)

### Key Lessons
1. Always test against real zip files, not just mocked data — the directory-entry count bug only manifests with real Webflow exports
2. Use host-provided CSS classes for standard UI elements (buttons, inputs) — theme variables in custom CSS are unreliable across Ship Studio themes
3. Research phase pays for itself on unknown APIs — the file picker question was critical and would have blocked Phase 2 without upfront research

### Cost Observations
- Model mix: ~30% opus (orchestrator), ~70% sonnet (researchers, planners, checkers, executors, verifiers)
- Sessions: 1 continuous session
- Notable: All 5 phases planned + executed in a single session. TDD phases (02-01, 03-01, 04-01, 05-01) were fastest — pure logic with clear I/O contracts

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 5 | Initial baseline — TDD + sibling reference pattern |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 145 | High (all modules) | 0 (zero runtime dependencies) |

### Top Lessons (Verified Across Milestones)

1. Test against real data, not just mocks
2. Use host CSS classes, not custom theme overrides
