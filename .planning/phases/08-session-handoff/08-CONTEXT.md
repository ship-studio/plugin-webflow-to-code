# Phase 8: Session Handoff - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a "Continue Migration" button to the progress view that copies a resume prompt, and handle the state transitions for when the plan file doesn't exist yet (simplified since plugin now writes skeleton).

</domain>

<decisions>
## Implementation Decisions

### Continue Migration button
- Visible in the progress view (MigrationProgress component), below the item list
- Copies a prompt to clipboard that tells the agent: read .shipstudio/migration-plan.json and .shipstudio/assets/brief.md, continue from where you left off
- Shows "Copied!" feedback for 2 seconds (same pattern as Copy Brief button)
- Prompt is lightweight — points to files, doesn't include full brief content

### Waiting state (simplified)
- Since plugin writes skeleton during brief generation, the plan file exists immediately
- HAND-02 is satisfied: the "waiting" state is effectively zero-length — plan exists from the moment brief is generated
- No separate "Waiting for plan..." UI needed — the progress view at 0% IS the waiting state
- HAND-03 is satisfied: auto-transition is instant since plan file is written in the same pipeline step as the brief

### Claude's Discretion
- Exact wording of the resume prompt
- Button styling (ghost button like Start Over, or more prominent)
- Whether to show the button only when progress > 0 or always

</decisions>

<canonical_refs>
## Canonical References

### Progress UI (where button integrates)
- `src/components/MigrationProgress.tsx` — Component where Continue Migration button is added
- `src/brief/io.ts` — copyToClipboard function to reuse for the resume prompt

### Plan types
- `src/plan/types.ts` — MigrationPlan type for generating resume context

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `copyToClipboard()` in `src/brief/io.ts` — copies text to clipboard via pbcopy
- Copy feedback pattern in MainView (copied state + setTimeout reset)
- `wf2c-btn-ghost` style for secondary actions

### Integration Points
- MigrationProgress component — button goes at the bottom
- Shell access already available via props

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard clipboard copy with resume prompt.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-session-handoff*
*Context gathered: 2026-03-18*
