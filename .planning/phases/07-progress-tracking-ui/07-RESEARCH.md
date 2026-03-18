# Phase 7: Progress Tracking UI - Research

**Researched:** 2026-03-18
**Domain:** React UI, polling with useEffect, inline-style component patterns, ship Studio plugin environment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Progress layout**
- Progress section sits BELOW the existing results panel (brief stats + copy button stay at top)
- "Migration Progress" label above the section (same style as "Output" label)
- Overall progress bar at the top of the progress section showing total completion percentage and item count
- Progress bar color: green fill on dark track

**Expand/collapse UX**
- Click to toggle individual pages — multiple can be open at once (not accordion)
- Collapsed state shows: arrow indicator (▶/▼) + page name + completion fraction (e.g., "3/5")
- Expanded state shows individual sections/components as a list with status indicators
- Agent notes shown inline below section name as muted text (only if notes field is present)

**Visual status indicators**
- Three statuses rendered as symbols with color:
  - `pending` → ○ (gray/muted)
  - `in-progress` → ◆ (blue, accent color)
  - `complete` → ✓ (green)
- Shared components (nav, footer) rendered the same way as section items but at the top of the list
- No animations needed

**Empty/error states**
- All-pending state (0% complete): show normally at 0% with progress bar empty and all items gray. No special message.
- Parse error / file missing: inline error message in progress section area ("Could not read migration plan"). Results panel above continues working.
- Poll failure: silently retry next interval. Only show error if file was previously readable and now isn't.

**Polling**
- Poll `.shipstudio/migration-plan.json` every 30 seconds via shell.exec
- Read file, parse JSON, update UI state
- Polling starts when step is 'done' (brief has been generated, plan file exists)

### Claude's Discretion
- Exact CSS for progress bar (height, border-radius, transitions)
- How to structure the React component tree (single component vs split)
- Whether to memoize parsed plan data
- Exact animation/transition on expand/collapse (if any)

### Deferred Ideas (OUT OF SCOPE)
- "Reset Plan" button to regenerate skeleton if agent corrupts the file — future
- Plan file diff detection (only re-render if content actually changed) — optimization, defer
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROG-01 | Plugin shows expandable per-page progress (page name, section count, completion fraction) | MigrationPlan/PlanItem types cover all needed data; parent items with type 'page' have children array for sections |
| PROG-02 | Expanded page shows individual sections/components with checkmark or pending status | PlanStatus type has three states; children PlanItem array carries per-section status and optional notes field |
| PROG-03 | Overall progress bar/percentage shown across all pages | Completion fraction computable by flattening all leaf items (children if present, else parent itself) and counting status === 'complete' |
| PROG-04 | Plugin polls `.shipstudio/migration-plan.json` every 30s to refresh progress | saveMigrationPlan io.ts shows exact shell.exec + base64-encode pattern; reading mirrors it with base64 decode via `base64 -d` or `cat | base64 -D` |
</phase_requirements>

---

## Summary

Phase 7 adds a read-only progress view beneath the existing results panel in MainView. The view reads `.shipstudio/migration-plan.json` on a 30-second polling interval, parses it into the already-defined `MigrationPlan` / `PlanItem` types, and renders an expandable per-page list with an overall progress bar.

The entire domain is self-contained in the existing codebase. No new libraries are needed. The pattern for file reads via shell.exec is established in `src/plan/io.ts` (save direction) — the read direction is a symmetric shell command. React patterns (inline styles required, useCallback for handlers, useEffect with cleanup for intervals, shellRef for stable shell access) are all established and consistently used in MainView.tsx and PreserveCheckbox.

**Primary recommendation:** Implement as a dedicated `MigrationProgress` component that accepts `shell` and `projectPath` as props, owns its own polling interval, and is mounted inside the `step.kind === 'done'` block of MainView. Inline styles throughout — class names only where the global `PLUGIN_CSS` string already defines them.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 (peer) | Component rendering, useState, useEffect, useCallback | Already in use across the entire plugin |
| TypeScript | ^5.6 | Types — MigrationPlan, PlanItem, PlanStatus already defined | Project standard |
| Vitest | ^4.1.0 | Unit tests | Already configured, all other modules tested |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsdom (vitest env) | ^29.0.0 | DOM environment in tests | Applied via `// @vitest-environment jsdom` comment, same as plan tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Polling with setInterval/useEffect | File system watcher (chokidar, etc.) | Watcher not available through shell.exec; polling is simpler and already decided |
| Inline styles for interactive elements | CSS classes in PLUGIN_CSS | Ship Studio overrides class-based styles on interactive elements — inline styles are mandatory (established lesson) |
| Dedicated MigrationProgress component | Embedding all logic in MainView | Dedicated component keeps MainView clean and is independently testable |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

New files to add:

```
src/
├── plan/
│   ├── types.ts          # Already exists — MigrationPlan, PlanItem, PlanStatus
│   ├── generate.ts       # Already exists
│   ├── generate.test.ts  # Already exists
│   ├── io.ts             # Already exists — saveMigrationPlan
│   ├── io.test.ts        # Already exists
│   ├── read.ts           # NEW — loadMigrationPlan (mirrors io.ts, reads instead of writes)
│   └── read.test.ts      # NEW — unit tests for loadMigrationPlan
└── components/
    └── MigrationProgress.tsx  # NEW — progress view component
```

`MigrationProgress` renders into `MainView.tsx` inside the `step.kind === 'done'` block. No new test file needed for the component itself (UI components are not unit-tested in this project — no existing component test files exist).

### Pattern 1: File Read via shell.exec (mirrors saveMigrationPlan)

**What:** Read a file through shell.exec using `cat` with base64 encoding to handle binary-safe transfer, then decode in JS.

**When to use:** Any time the plugin reads a file from the project directory.

**Example:**
```typescript
// Source: src/plan/io.ts (save direction as reference; read mirrors it)
// src/plan/read.ts
import type { MigrationPlan } from './types';

interface ShellLike {
  exec(cmd: string, args: string[]): Promise<{ exit_code: number; stdout: string; stderr: string }>;
}

export async function loadMigrationPlan(
  shell: ShellLike,
  projectPath: string,
): Promise<MigrationPlan | null> {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const result = await shell.exec('bash', [
    '-c',
    `cat '${planPath}' | base64`,
  ]);
  if (result.exit_code !== 0) {
    return null; // file doesn't exist or not readable
  }
  try {
    const json = decodeURIComponent(escape(atob(result.stdout.trim())));
    return JSON.parse(json) as MigrationPlan;
  } catch {
    return null; // parse failure
  }
}
```

Note: `saveMigrationPlan` uses `btoa(unescape(encodeURIComponent(json)))` to encode. The inverse for reading is `decodeURIComponent(escape(atob(b64)))`. This pair handles UTF-8 characters correctly.

### Pattern 2: Polling Interval via useEffect with Cleanup

**What:** Start a setInterval on mount (or when a condition becomes true), clear it on unmount.

**When to use:** PROG-04 — poll every 30 seconds while `step.kind === 'done'`.

**Example:**
```typescript
// Source: Established React pattern; aligns with useEffect cleanup conventions used in Modal.tsx
useEffect(() => {
  if (!shell || !projectPath) return;

  // poll immediately on mount, then every 30s
  const poll = async () => {
    const plan = await loadMigrationPlan(shell, projectPath);
    if (plan !== null) {
      setPlan(plan);
      setPollError(false);
    } else if (hadPlanRef.current) {
      // was previously readable, now isn't — show error
      setPollError(true);
    }
    if (plan !== null) hadPlanRef.current = true;
  };

  poll(); // immediate first read
  const id = setInterval(poll, 30_000);
  return () => clearInterval(id);
}, [shell, projectPath]);
```

### Pattern 3: Expand/Collapse State per Page Item

**What:** A Set of expanded page indices (or names) in local state. Click toggles membership.

**When to use:** PROG-01 — multiple pages can be expanded simultaneously.

**Example:**
```typescript
const [expanded, setExpanded] = useState<Set<number>>(new Set());

const toggleExpanded = useCallback((idx: number) => {
  setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return next;
  });
}, []);
```

### Pattern 4: Progress Computation

**What:** Flatten the plan into leaf items, count complete vs total.

**Key insight about plan structure:**
- `type === 'shared'` items are always leaves (no children in generated plans)
- `type === 'page'` items may have children; if they do, the page itself is not a leaf — its children are
- `type === 'page'` items without children ARE leaves (CMS templates, pages with no sections)
- `type === 'section'` / `type === 'component'` items are always leaves

This means: for computing overall progress, iterate all items; if item has children, count the children as leaves; otherwise count the item itself as a leaf.

**Example:**
```typescript
function computeProgress(plan: MigrationPlan): { complete: number; total: number } {
  let complete = 0;
  let total = 0;
  for (const item of plan.items) {
    const leaves = item.children && item.children.length > 0 ? item.children : [item];
    for (const leaf of leaves) {
      total++;
      if (leaf.status === 'complete') complete++;
    }
  }
  return { complete, total };
}
```

For the per-page fraction (PROG-01): a page item's fraction is `children.filter(c => c.status === 'complete').length / children.length`. If page has no children, it is 1/1 complete or 0/1 pending based on its own status.

### Pattern 5: Status Symbol Rendering (inline styles required)

**What:** Map PlanStatus to symbol string and color using inline styles.

**When to use:** PROG-02 — every section/component row.

**Example:**
```typescript
const STATUS_SYMBOL: Record<PlanStatus, string> = {
  pending: '○',
  'in-progress': '◆',
  complete: '✓',
};
const STATUS_COLOR: Record<PlanStatus, string> = {
  pending: 'var(--text-muted)',
  'in-progress': 'var(--accent, #0d99ff)',
  complete: '#4caf50',
};

// Usage:
<span style={{ color: STATUS_COLOR[item.status], fontSize: '11px', minWidth: '14px' }}>
  {STATUS_SYMBOL[item.status]}
</span>
```

Note: `#4caf50` matches the green already used for the success SVG circle in the results panel header.

### Pattern 6: Progress Bar (inline styles)

**What:** A simple two-div bar — outer track, inner fill — both using inline styles.

**Example:**
```typescript
const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

<div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
  <div style={{
    height: '100%',
    width: `${pct}%`,
    background: '#4caf50',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  }} />
</div>
```

### Anti-Patterns to Avoid

- **Using CSS class names for interactive element styles:** Ship Studio overrides them. Use inline styles for all interactive elements (click targets, state-dependent colors, expand indicators). Class names from `PLUGIN_CSS` are safe only for non-interactive layout containers.
- **Adding new class names to PLUGIN_CSS for colored or interactive elements:** These will be overridden at runtime. Keep interactive styling inline.
- **Calling loadMigrationPlan directly in MainView:** Shell is available via `shellRef.current` but polling cleanup needs to be scoped to MigrationProgress lifecycle. Pass shell and projectPath as props.
- **Using accordion (single-open) expand pattern:** The decision specifies multiple pages can be open simultaneously. Use a Set, not a single index.
- **Showing error before first successful read:** Only surface poll errors if `hadPlan` was previously true. First-read failure means file not yet written — silent is correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Base64 encode/decode for UTF-8 JSON | Custom encoder | `btoa/atob` + `encodeURIComponent/decodeURIComponent` pair (already in io.ts) | Already established in saveMigrationPlan; symmetric decode is well-understood |
| Status color/symbol mapping | Conditional chains | Static Record<PlanStatus, string> lookup | Exhaustive at compile time, trivially extensible |
| Progress percentage math | Complex logic | Simple count of leaves (see Pattern 4) | Plan structure is shallow (2 levels max in generated plans) |

**Key insight:** The entire data model (MigrationPlan, PlanItem, PlanStatus) is already defined in `src/plan/types.ts`. No schema design work is needed for this phase — just parse and display.

---

## Common Pitfalls

### Pitfall 1: Inline vs Class-based Styles for Interactive Elements
**What goes wrong:** Adding click handlers and state-dependent styling via CSS classes gets silently overridden by Ship Studio's host environment at runtime. The component appears unstyled or uses wrong colors.
**Why it happens:** Ship Studio injects its own stylesheet that overrides plugin class-based styles on interactive elements.
**How to avoid:** All state-dependent styling (expand arrow direction, status colors, hover states on clickable rows) must use inline `style={{}}` props. This is the established pattern from PreserveCheckbox.
**Warning signs:** Styles visible in local dev but wrong inside Ship Studio plugin panel.

### Pitfall 2: Wrong base64 decode for UTF-8 JSON
**What goes wrong:** Using `atob(b64)` directly produces a Latin-1 string that throws on JSON.parse for any non-ASCII content in page names or section labels.
**Why it happens:** `atob` returns a byte string, not a UTF-8 string.
**How to avoid:** Mirror the encode/decode pair from io.ts exactly: encode is `btoa(unescape(encodeURIComponent(s)))`, decode is `decodeURIComponent(escape(atob(b64)))`.
**Warning signs:** JSON.parse throws "Unexpected token" on sites with non-ASCII page names.

### Pitfall 3: setInterval Not Cleaned Up
**What goes wrong:** If the MigrationProgress component unmounts (e.g., user clicks Start Over → step goes back to idle), the interval keeps running, calling setState on an unmounted component.
**Why it happens:** Missing cleanup return from useEffect.
**How to avoid:** Always `return () => clearInterval(id)` from the useEffect that sets up the interval. This is standard React — Modal.tsx shows the cleanup pattern.
**Warning signs:** React warning about "Can't perform a React state update on an unmounted component."

### Pitfall 4: Counting Page Items Instead of Leaf Items for Progress
**What goes wrong:** Page items with children are counted as leaves, inflating the total and making the progress bar jump unexpectedly when children complete.
**Why it happens:** Naive `plan.items.length` count treats pages and leaves uniformly.
**How to avoid:** Use the leaf-counting logic in Pattern 4 — if item has children, count the children; otherwise count the item. This matches the agent's granularity for updating statuses.
**Warning signs:** Overall bar shows 50% when half the pages are "complete" at the page level, but individual sections are not yet started.

### Pitfall 5: Shell Reference Staleness
**What goes wrong:** Capturing `ctx?.shell` in a closure at mount time means it can become stale if the context re-renders.
**Why it happens:** The shell object from usePluginContext can theoretically be replaced.
**How to avoid:** Mirror the `shellRef` pattern already in MainView — pass `shellRef.current` into the component or pass it as a prop from the outer ref. Do NOT read ctx directly inside a setInterval callback.
**Warning signs:** Poll calls silently fail or use stale shell.

---

## Code Examples

Verified patterns from existing codebase:

### Reading a file via shell.exec (symmetric to saveMigrationPlan)
```typescript
// Source: src/plan/io.ts (reference for the write direction)
// The read direction:
const result = await shell.exec('bash', ['-c', `cat '${planPath}' | base64`]);
if (result.exit_code !== 0) return null;
const json = decodeURIComponent(escape(atob(result.stdout.trim())));
return JSON.parse(json) as MigrationPlan;
```

### useEffect interval with cleanup (mirrors Modal.tsx cleanup pattern)
```typescript
// Source: src/components/Modal.tsx — useEffect with cleanup return
useEffect(() => {
  const id = setInterval(poll, 30_000);
  poll(); // fire immediately
  return () => clearInterval(id);
}, [shell, projectPath]);
```

### Inline styles for clickable rows (mirrors PreserveCheckbox)
```typescript
// Source: src/views/MainView.tsx — PreserveCheckbox component (lines 17-54)
<div
  onClick={handleToggle}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    // all styling inline — not via class names
  }}
>
```

### Existing color tokens (from src/styles.ts)
```
var(--bg-primary)       — modal/page background
var(--bg-secondary)     — card/input background
var(--border)           — border color
var(--text-primary)     — primary text
var(--text-secondary)   — secondary text
var(--text-muted)       — muted/placeholder text
var(--accent, #0d99ff)  — blue accent, with #0d99ff fallback
```

### wf2c-results-output-label style reference (for "Migration Progress" label)
```css
/* Source: src/styles.ts — .wf2c-results-output-label */
font-size: 11px;
font-weight: 500;
color: var(--text-muted);
text-transform: uppercase;
letter-spacing: 0.5px;
```
This is the label style to reuse for "Migration Progress" heading.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based styles for all elements | Inline styles for interactive elements | Discovered during v1.1 development (PreserveCheckbox) | Must be applied to all new clickable elements |
| N/A | MigrationPlan / PlanItem types defined in Phase 6 | Phase 6 (complete) | Phase 7 has zero schema work — types are ready |

**Deprecated/outdated:**
- None applicable to this phase.

---

## Open Questions

1. **macOS vs Linux base64 flag**
   - What we know: `saveMigrationPlan` uses `base64 -d` (Linux flag). macOS uses `base64 -D` (capital D). The current save command already uses `-d` and works in the Ship Studio environment.
   - What's unclear: Whether Ship Studio runs bash in a Linux-like environment or macOS native.
   - Recommendation: Mirror the exact flag used in `saveMigrationPlan` (already working). For the read direction, `cat file | base64` encodes without flags — only the decode direction differs. If the save pattern works, the read's encode (`cat | base64`) has no flag to worry about. The decode in JS (`atob`) runs in the browser JS context, not in shell — so no OS flag issue on the read side.

2. **Scroll behavior of progress section**
   - What we know: `.wf2c-modal-body` has `overflow-y: auto` and `max-height: 80vh` on the modal. The progress section can grow large on sites with many pages.
   - What's unclear: Whether the progress list should be independently scrollable or rely on the outer modal scroll.
   - Recommendation: Rely on the outer modal scroll (already set up). No inner scroll needed — the outer container handles it. This is simpler and consistent with how the rest of the body works.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` — includes `src/**/*.test.ts` |
| Quick run command | `npx vitest run src/plan/read.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROG-01 | loadMigrationPlan returns null on shell failure | unit | `npx vitest run src/plan/read.test.ts` | ❌ Wave 0 |
| PROG-01 | loadMigrationPlan returns null on JSON parse error | unit | `npx vitest run src/plan/read.test.ts` | ❌ Wave 0 |
| PROG-01 | loadMigrationPlan returns MigrationPlan on success | unit | `npx vitest run src/plan/read.test.ts` | ❌ Wave 0 |
| PROG-01 | computeProgress returns correct complete/total for mixed-status plan | unit | `npx vitest run src/plan/read.test.ts` | ❌ Wave 0 |
| PROG-02 | computeProgress counts children as leaves (not parent page) when children present | unit | `npx vitest run src/plan/read.test.ts` | ❌ Wave 0 |
| PROG-03 | computeProgress handles plan with no children items (all shared/leaf pages) | unit | `npx vitest run src/plan/read.test.ts` | ❌ Wave 0 |
| PROG-04 | loadMigrationPlan constructs correct shell command with projectPath | unit | `npx vitest run src/plan/read.test.ts` | ❌ Wave 0 |
| PROG-01–04 | MigrationProgress component renders (smoke) | manual-only | — | N/A — no component test infrastructure in project |

Note: `MigrationProgress.tsx` component is not unit-tested (no existing component test infrastructure; all component logic is manual/visual verification, consistent with rest of codebase where MainView has no test file).

### Sampling Rate
- **Per task commit:** `npx vitest run src/plan/read.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/plan/read.ts` — loadMigrationPlan function (new file, covers PROG-04)
- [ ] `src/plan/read.test.ts` — unit tests for loadMigrationPlan and computeProgress (covers PROG-01, PROG-02, PROG-03, PROG-04)

*(MigrationProgress component has no unit test gap — no component test infrastructure exists in this project, consistent with all other components.)*

---

## Sources

### Primary (HIGH confidence)
- `src/plan/types.ts` — MigrationPlan, PlanItem, PlanStatus definitions (authoritative)
- `src/plan/io.ts` — saveMigrationPlan shell.exec + base64 pattern (authoritative, working in production)
- `src/views/MainView.tsx` — Results panel structure, shellRef pattern, useCallback pattern (authoritative)
- `src/styles.ts` — All existing CSS custom properties and class definitions (authoritative)
- `src/components/Modal.tsx` — useEffect cleanup pattern (authoritative)
- `src/types.ts` — Shell interface, PluginContextValue (authoritative)
- `vitest.config.ts` — Test configuration and include pattern (authoritative)
- `package.json` — Dependency versions (authoritative)

### Secondary (MEDIUM confidence)
- None — all research is based on direct codebase inspection.

### Tertiary (LOW confidence)
- None — no external sources required for this phase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entire stack is pre-established; no new dependencies
- Architecture: HIGH — patterns directly derived from existing working code in the codebase
- Pitfalls: HIGH — pitfalls sourced from existing established patterns (PreserveCheckbox inline style lesson) and standard React cleanup requirements
- Data model: HIGH — MigrationPlan types already defined and tested in Phase 6

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable — no external dependencies to track)
