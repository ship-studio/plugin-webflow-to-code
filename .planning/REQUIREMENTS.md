# Requirements: Webflow to Code

**Defined:** 2026-03-16
**Core Value:** Users get the "aha moment" — after running the plugin and letting their coding agent work from the brief, they see something that looks almost exactly like their Webflow site, now living in real code.

## v1.0 Requirements (Validated)

All v1.0 requirements shipped and validated. See MILESTONES.md for details.

- [x] **ZIP-01** through **ZIP-04**: Zip input, extraction, validation, progress — Phase 1-2
- [x] **ASST-01** through **ASST-03**: Asset copying, manifest, responsive variants — Phase 3
- [x] **PAGE-01** through **PAGE-04**: Page discovery, structure, CSS reference, shared layout — Phase 4
- [x] **WFLW-01** through **WFLW-03**: Component detection, interactions, CMS templates — Phase 4
- [x] **BREF-01** through **BREF-04**: Mode selection, instructions, multi-session, token count — Phase 5
- [x] **INFR-01** through **INFR-02**: Ship Studio conventions, plugin-starter structure — Phase 1

## v1.1 Requirements

Requirements for Migration Tracker milestone. Each maps to roadmap phases.

### Plan Schema

- [ ] **PLAN-01**: Brief instructs agent to create `.shipstudio/migration-plan.json` as its first action
- [ ] **PLAN-02**: Plan schema captures pages with sections/components as nested items, each with a status
- [ ] **PLAN-03**: Plan schema includes shared components (nav, footer) as top-level items
- [ ] **PLAN-04**: Agent updates plan file status as it completes each item

### Progress UI

- [ ] **PROG-01**: Plugin shows expandable per-page progress (page name, section count, completion fraction)
- [ ] **PROG-02**: Expanded page shows individual sections/components with checkmark or pending status
- [ ] **PROG-03**: Overall progress bar/percentage shown across all pages
- [ ] **PROG-04**: Plugin polls `.shipstudio/migration-plan.json` every 30s to refresh progress

### Session Handoff

- [ ] **HAND-01**: "Continue Migration" button copies a prompt that tells the agent to read plan file + brief and resume
- [ ] **HAND-02**: "Waiting for plan" state shown after brief is copied, before plan file exists
- [ ] **HAND-03**: Plugin auto-transitions from waiting → progress view when plan file appears

### UX Polish (already shipped pre-milestone)

- [x] **UX-01**: Best Site mode includes preserve options checklist with custom instructions textarea
- [x] **UX-02**: Results panel redesigned with success state, output label, ghost Start Over button
- [x] **UX-03**: Multi-session tip shown for sites with >3 pages

## Future Requirements

### Inspiration Mode

- **INSP-01**: Third conversion mode for creative reinterpretation of the site
- **INSP-02**: User provides style/mood direction for the rebuild

### CMS Integration

- **CMS-01**: Export CMS data via Webflow API
- **CMS-02**: Generate data models from CMS collections

## Out of Scope

| Feature | Reason |
|---------|--------|
| Actual code conversion | Plugin prepares the brief; the coding agent does the conversion |
| Framework detection or framework-specific output | Brief is agent-agnostic |
| Design token re-extraction from CSS | Raw CSS files serve as reference |
| Agent orchestration | Plugin observes, doesn't drive the coding agent |
| Framework-specific plan steps | Plan is framework-agnostic like the brief |
| Real-time file watching | Shell.exec polling at 30s is simpler and sufficient |
| Plan editing in plugin UI | User edits through the agent, plugin is read-only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAN-01 | TBD | Pending |
| PLAN-02 | TBD | Pending |
| PLAN-03 | TBD | Pending |
| PLAN-04 | TBD | Pending |
| PROG-01 | TBD | Pending |
| PROG-02 | TBD | Pending |
| PROG-03 | TBD | Pending |
| PROG-04 | TBD | Pending |
| HAND-01 | TBD | Pending |
| HAND-02 | TBD | Pending |
| HAND-03 | TBD | Pending |
| UX-01 | Pre-milestone | Complete |
| UX-02 | Pre-milestone | Complete |
| UX-03 | Pre-milestone | Complete |

**Coverage:**
- v1.1 requirements: 14 total
- Already complete: 3 (UX polish, shipped pre-milestone)
- To be mapped: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-18 after v1.1 milestone requirements*
