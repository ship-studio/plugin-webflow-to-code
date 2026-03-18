---
phase: 06-migration-plan-schema-and-brief-integration
plan: 02
subsystem: ui
tags: [react, brief-generation, migration-plan, session-tracking]

# Dependency graph
requires:
  - phase: 06-01
    provides: generateMigrationPlan function, saveMigrationPlan function, MigrationPlan schema types
provides:
  - Brief output replaced Session Tracker with structured Migration Plan preamble referencing .shipstudio/migration-plan.json
  - MainView pipeline generates and saves migration-plan.json alongside brief.md
  - Results panel displays both output file paths
affects: [07-progress-tracker-ui, 08-continue-migration-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brief preamble pattern: static section explaining how to use an adjacent file (no dynamic content in brief)"
    - "Pipeline extension: fire-and-forget generate+save after existing save call inside same try/catch"

key-files:
  created: []
  modified:
    - src/brief/generate.ts
    - src/brief/generate.test.ts
    - src/views/MainView.tsx

key-decisions:
  - "Migration Plan section is static (no params) — plan file is the dynamic content, brief just explains how to use it"
  - "Migration Plan section positioned before How to Use This Brief — 'read the plan first' is step 1"
  - "Plan generation shares the Step 6 try/catch with brief — any save failure surfaces as brief generation failed"

patterns-established:
  - "Static brief sections: buildMigrationPlanSection() takes no params and returns a fixed instruction string"
  - "Regression guards: not.toContain tests ensure removed sections cannot silently re-appear"

requirements-completed: [PLAN-01, PLAN-04]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 6 Plan 2: Brief Integration - Migration Plan Preamble Summary

**Brief Session Tracker replaced with static Migration Plan preamble referencing .shipstudio/migration-plan.json, and MainView now writes both brief.md and migration-plan.json in a single pipeline step**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-18T14:24:00Z
- **Completed:** 2026-03-18T14:32:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed buildSessionTrackerSection (dynamic, checkbox-based) and replaced with buildMigrationPlanSection (static preamble with JSON schema example)
- Migration Plan section now appears before the instructions section so agents read the plan file first
- Best-site instructions updated to reference migration-plan.json instead of Session Tracker
- MainView imports generateMigrationPlan and saveMigrationPlan; calls both after brief is saved
- Results panel shows .shipstudio/migration-plan.json as a second output artifact
- Multi-session tip updated to explain plan file tracking
- All 164 tests pass; 8 new Migration Plan tests including regression guards for Session Tracker and MIGRATION_LOG.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Session Tracker with migration plan preamble in brief generation** - `47cff78` (feat)
2. **Task 2: Wire MainView to generate and save migration plan alongside brief** - `16cff4e` (feat)

## Files Created/Modified
- `src/brief/generate.ts` - Replaced buildSessionTrackerSection with buildMigrationPlanSection (static, no params); updated sections array ordering; updated best-site instruction text
- `src/brief/generate.test.ts` - Replaced Session Tracker describe block (5 tests) with Migration Plan describe block (8 tests including regression guards)
- `src/views/MainView.tsx` - Added generateMigrationPlan and saveMigrationPlan imports; added pipeline calls after saveBrief; updated tip text and output display

## Decisions Made
- Migration Plan section is static (no params) — the plan file itself is the dynamic content, so the brief only needs a fixed explanation of how to use it. This keeps the brief from duplicating plan data.
- Section positioned as second item in sections array (after metadata, before instructions) — agents should orient to the plan file before reading methodology.
- Plan generation/save errors share the Step 6 catch block — no new error handling state needed, and a plan write failure should block the done step.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- migration-plan.json is now written automatically during every brief generation run
- Brief instructs agents to read and update the plan file across sessions
- Phase 7 (Progress Tracker UI) can now read migration-plan.json via polling to display progress
- Phase 8 (Continue Migration Flow) can reference the plan file path from the brief's instructions

---
*Phase: 06-migration-plan-schema-and-brief-integration*
*Completed: 2026-03-18*
