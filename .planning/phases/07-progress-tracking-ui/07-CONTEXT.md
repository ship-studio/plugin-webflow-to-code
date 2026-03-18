# Phase 7: Progress Tracking UI - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the live migration progress view in the plugin UI. Reads `.shipstudio/migration-plan.json` via polling, renders expandable per-page progress with section-level detail, and shows overall completion. This is a read-only view — the agent writes to the plan file, the plugin just displays it.

</domain>

<decisions>
## Implementation Decisions

### Progress layout
- Progress section sits BELOW the existing results panel (brief stats + copy button stay at top)
- "Migration Progress" label above the section (same style as "Output" label)
- Overall progress bar at the top of the progress section showing total completion percentage and item count
- Progress bar color: green fill on dark track

### Expand/collapse UX
- Click to toggle individual pages — multiple can be open at once (not accordion)
- Collapsed state shows: arrow indicator (▶/▼) + page name + completion fraction (e.g., "3/5")
- Expanded state shows individual sections/components as a list with status indicators
- Agent notes shown inline below section name as muted text (only if notes field is present)

### Visual status indicators
- Three statuses rendered as symbols with color:
  - `pending` → ○ (gray/muted)
  - `in-progress` → ◆ (blue, accent color)
  - `complete` → ✓ (green)
- Shared components (nav, footer) rendered the same way as section items but at the top of the list
- No animations needed

### Empty/error states
- All-pending state (0% complete): show normally at 0% with progress bar empty and all items gray. No special message.
- Parse error / file missing: inline error message in progress section area ("Could not read migration plan"). Results panel above continues working.
- Poll failure: silently retry next interval. Only show error if file was previously readable and now isn't.

### Polling
- Poll `.shipstudio/migration-plan.json` every 30 seconds via shell.exec
- Read file, parse JSON, update UI state
- Polling starts when step is 'done' (brief has been generated, plan file exists)

### Claude's Discretion
- Exact CSS for progress bar (height, border-radius, transitions)
- How to structure the React component tree (single component vs split)
- Whether to memoize parsed plan data
- Exact animation/transition on expand/collapse (if any)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plan types (source of truth for what to parse)
- `src/plan/types.ts` — `MigrationPlan`, `PlanItem`, `PlanStatus` types that define the JSON structure
- `src/plan/io.ts` — `saveMigrationPlan()` shows the shell.exec pattern for file I/O (read will mirror this)

### Current UI (where progress view integrates)
- `src/views/MainView.tsx` — Results panel rendered when `step.kind === 'done'`, progress section goes below
- `src/styles.ts` — `PLUGIN_CSS` string with all existing styles, new styles added here
- `src/components/Modal.tsx` — Modal shell that injects styles into document.head

### Plugin context (for shell access)
- `src/context.ts` — `usePluginContext()` hook providing shell access for file reads

### Existing UI patterns
- `src/views/MainView.tsx` lines 188-219 — Results panel structure (inline styles needed for Ship Studio rendering)
- PreserveCheckbox component — demonstrates that inline styles are REQUIRED (class-based styles get overridden in Ship Studio environment)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MigrationPlan` / `PlanItem` types from `src/plan/types.ts` — parse result maps directly to these
- `saveMigrationPlan()` I/O pattern — reading will use same shell.exec + base64 decode pattern in reverse
- `PreserveCheckbox` component pattern — inline styles required for Ship Studio rendering (critical lesson from v1.1 development)
- `wf2c-results-output-label` class — style reference for "Migration Progress" label

### Established Patterns
- All file I/O through shell.exec with base64 encoding
- Inline styles required for interactive elements (Ship Studio overrides class-based CSS)
- `shellRef` pattern in MainView for stable shell reference across re-renders
- `useCallback` for all event handlers

### Integration Points
- Progress component renders inside the `step.kind === 'done'` block in MainView, after the existing results panel
- Shell access via `shellRef.current` (already available in MainView)
- Polling interval managed by `useEffect` with cleanup

</code_context>

<specifics>
## Specific Ideas

- Progress UI should feel like a task list — clean, scannable, not cluttered
- The preview mockup from the milestone discussion is the target:
  ```
  ▼ Homepage  (3/5)
    ✓ Shared Nav
    ✓ Hero Section
    ◆ Features Section
    ○ Testimonials
    ○ Footer

  ▶ About  (0/3)
  ▶ Contact  (0/2)
  ```

</specifics>

<deferred>
## Deferred Ideas

- "Reset Plan" button to regenerate skeleton if agent corrupts the file — future
- Plan file diff detection (only re-render if content actually changed) — optimization, defer

</deferred>

---

*Phase: 07-progress-tracking-ui*
*Context gathered: 2026-03-18*
