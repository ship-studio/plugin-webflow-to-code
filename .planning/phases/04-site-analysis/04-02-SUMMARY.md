---
phase: 04-site-analysis
plan: 02
subsystem: analysis
tags: [shared-layout, site-analysis, orchestrator, tdd, jsdom]

requires:
  - phase: 04-site-analysis
    provides: PageInfo, discoverHtmlPages, parsePage from Plan 01
  - phase: 02-zip-input
    provides: ZipManifest entries for discoverHtmlPages
provides:
  - detectSharedLayout function with data-w-id primary detection and class-name fallback
  - buildSiteAnalysis orchestrator as single entry point for Phase 5
affects: [04-03, 05-brief-generation]

tech-stack:
  added: []
  patterns: [frequency-based shared element detection with confidence levels, class-name fallback for missing data-w-id]

key-files:
  created:
    - src/analysis/shared.ts
    - src/analysis/shared.test.ts
    - src/analysis/analyze.ts
    - src/analysis/analyze.test.ts
  modified:
    - src/analysis/types.ts
    - src/analysis/parse.ts

key-decisions:
  - "navClassName/footerClassName added to PageInfo for class-name fallback detection"
  - "Shared layout confidence levels: high for data-w-id match, medium for class-name fallback"
  - "Fewer than 2 content pages returns no shared layout (edge case guard)"

patterns-established:
  - "Frequency-based detection: count element ID occurrences, threshold at ceil(50%), fallback to className"
  - "Orchestrator pattern: buildSiteAnalysis is single entry point composing discover -> parse -> detect -> aggregate"

requirements-completed: [PAGE-04]

duration: 3min
completed: 2026-03-16
---

# Phase 4 Plan 2: Shared Layout Detection and Site Analysis Orchestrator Summary

**Shared nav/footer detection via data-w-id frequency (high confidence) with class-name fallback (medium confidence), plus buildSiteAnalysis orchestrator composing the full analysis pipeline -- 12 new tests, 111 total passing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T13:57:19Z
- **Completed:** 2026-03-16T14:00:36Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- detectSharedLayout identifies shared nav/footer across pages using data-w-id frequency with 50% threshold
- Class-name fallback detection when no data-w-id meets threshold, with medium confidence signal
- buildSiteAnalysis orchestrator: single entry point that discovers, parses, detects shared layout, and aggregates
- 12 new tests (7 shared layout + 5 orchestrator), 111 total green across full project

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared layout detection with data-w-id and class fallback** - `29f3281` (feat)
2. **Task 2: buildSiteAnalysis orchestrator** - `90e4437` (feat)

_Both tasks followed TDD: RED (failing tests) then GREEN (implementation)._

## Files Created/Modified
- `src/analysis/shared.ts` - detectSharedLayout with primary data-w-id and fallback class-name detection
- `src/analysis/shared.test.ts` - 7 tests covering all detection scenarios including edge cases
- `src/analysis/analyze.ts` - buildSiteAnalysis orchestrator composing full pipeline
- `src/analysis/analyze.test.ts` - 5 integration tests with mock shell pattern
- `src/analysis/types.ts` - Added navClassName/footerClassName to PageInfo interface
- `src/analysis/parse.ts` - Updated parsePage to extract navClassName/footerClassName from DOM

## Decisions Made
- Added navClassName and footerClassName fields to PageInfo for class-name fallback detection (extending Plan 01 types)
- Confidence levels: "high" for data-w-id frequency match, "medium" for class-name frequency match
- Fewer than 2 content pages returns no shared layout -- can't determine sharing from a single page
- CMS template pages excluded from threshold calculation (they may have different nav/footer)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added navClassName/footerClassName to PageInfo and parsePage**
- **Found during:** Task 1 (shared layout detection)
- **Issue:** Plan discussed adding these fields; parsePage needed to extract className from .w-nav and footer elements for class-name fallback to work
- **Fix:** Added fields to PageInfo in types.ts, updated parsePage to extract navEl.className and footerEl.className
- **Files modified:** src/analysis/types.ts, src/analysis/parse.ts
- **Verification:** All 40 analysis tests pass including existing parse.test.ts
- **Committed in:** 29f3281 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Planned modification to types.ts was necessary for class-name fallback. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- buildSiteAnalysis is the single entry point Phase 5 and MainView will call
- SiteAnalysis contains pages, sharedLayout, counts, and component union
- Plan 04-03 (if exists) can build on top of this analysis foundation
- 111 tests green across the full project

---
*Phase: 04-site-analysis*
*Completed: 2026-03-16*
