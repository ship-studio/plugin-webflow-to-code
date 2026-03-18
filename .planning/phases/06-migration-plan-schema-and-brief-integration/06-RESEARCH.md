# Phase 6: Migration Plan Schema and Brief Integration - Research

**Researched:** 2026-03-18
**Domain:** TypeScript schema design, brief generation pipeline modification, file I/O patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema structure**
- Hybrid approach: plugin provides a skeleton structure (pages + sections from analysis), agent can add/modify items but must keep the base format
- Items identified by name + type (no IDs needed)
- Two item types: `shared` (nav, footer) and `page` (with nested `children` for sections/components)
- Agent decides build order — pages in the plan can be reordered by the agent based on what makes sense for their framework
- Shared components (nav, footer) are top-level items, not nested under any page

**Schema bootstrapping**
- Plugin writes skeleton `migration-plan.json` during brief generation (alongside `brief.md`)
- All pages, sections, shared components pre-filled from SiteAnalysis with status "pending"
- Agent reads the file, adds items if needed (e.g., framework setup tasks), updates status as it builds
- This means the plan file exists immediately — no "waiting for plan" state needed (impacts Phase 8 HAND-02)

**Status granularity**
- Three status values: `pending`, `in-progress`, `complete`
- Items also support an optional `notes` field (string) for agent annotations like "responsive done, animations pending"
- Plugin UI can show notes in the expanded per-section view

**Brief instructions**
- Full JSON example included in the brief so the agent sees the exact format (~500 tokens, removes ambiguity)
- Instructions go at the top of the Instructions section — "Step 1: Read migration-plan.json. Step 2: Build the site."
- Replaces the existing Session Tracker section (plan file IS the tracker now, single source of truth)
- Brief tells agent: the plan file already exists, read it, update status as you complete each item, add new items if your framework needs them

### Claude's Discretion
- Exact JSON field names and nesting syntax
- Whether to include metadata fields (version, createdAt, etc.)
- How verbose the brief's JSON example should be
- Error handling if plan file is malformed when plugin reads it

### Deferred Ideas (OUT OF SCOPE)
- HAND-02 ("Waiting for plan" state) may be unnecessary since plugin writes the skeleton — revisit in Phase 8 planning
- Could add a "Reset Plan" button to regenerate the skeleton if the agent corrupts the file — defer to future
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | Brief instructs agent to create `.shipstudio/migration-plan.json` as its first action | Brief is actually updated to say "plan already exists, read it" — plugin creates skeleton, not agent. The brief instruction changes from "create" to "read and maintain". See Brief Injection Pattern section. |
| PLAN-02 | Plan schema captures pages with sections/components as nested items, each with a status | `PageInfo.sections[]` maps directly to `children[]`. `SectionItem.label` becomes the item name. See Schema Design section. |
| PLAN-03 | Plan schema includes shared components (nav, footer) as top-level items | `SharedLayout.hasSharedNav` / `hasSharedFooter` drive top-level shared items. See Schema Design section. |
| PLAN-04 | Agent updates plan file status as it completes each item | Brief instructions explicitly tell agent to update status field on each item. Plan file is single source of truth, replaces Session Tracker markdown. |
</phase_requirements>

---

## Summary

Phase 6 is a contained, two-concern implementation: (1) design and generate a `migration-plan.json` skeleton file from existing `SiteAnalysis` data, and (2) update `brief.md` to instruct the agent to use that file as its tracker instead of the old inline Session Tracker markdown section.

The entire data source already exists. `SiteAnalysis` contains `pages[]` (each with `sections[]`), and `SharedLayout` contains `hasSharedNav`/`hasSharedFooter`. The mapping from SiteAnalysis to plan JSON is direct and lossless — no new analysis is needed. The main work is schema design (pure TypeScript types), a skeleton generator function, a `saveMigrationPlan()` I/O function following the exact pattern of `saveBrief()`, and replacing `buildSessionTrackerSection()` with new brief instructions.

The existing test suite for `generate.test.ts` has Session Tracker coverage that will break. The strategy is: update those tests to expect the new plan-file instructions rather than the old checklist format. The `saveMigrationPlan()` function should be covered by a new test file (`src/plan/io.test.ts`) mirroring `src/brief/io.test.ts`. Type definitions go in `src/plan/types.ts`.

**Primary recommendation:** Implement in three units: `src/plan/types.ts` (schema types), `src/plan/generate.ts` (skeleton builder, pure function), `src/plan/io.ts` (file writer). Then wire into `generate.ts` (brief changes) and `MainView.tsx` (call plan save after brief save).

---

## Standard Stack

### Core (Already Present — No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.6.0 | Schema type definitions | Already in project |
| Vitest | ^4.1.0 | Unit testing plan generator and I/O | Already in project, established pattern |

No new npm dependencies are needed. JSON serialization is native (`JSON.stringify`). File writing reuses the existing `shell.exec` + base64 pattern from `saveBrief()`.

### No New Dependencies Required

The plan schema is plain JSON. Writing it uses the identical shell.exec + base64 encoding pattern already established in `src/brief/io.ts`. The skeleton generation is a pure TypeScript function mapping `SiteAnalysis` types to plan schema types.

**Installation:** None required.

---

## Architecture Patterns

### Recommended Module Structure

```
src/
├── plan/
│   ├── types.ts          # MigrationPlan, PlanItem, PlanStatus types
│   ├── generate.ts       # generateMigrationPlan(SiteAnalysis) → MigrationPlan
│   ├── io.ts             # saveMigrationPlan(shell, projectPath, plan) → void
│   └── generate.test.ts  # Unit tests for skeleton generator
│   └── io.test.ts        # Unit tests for file writer (mirrors brief/io.test.ts)
├── brief/
│   ├── generate.ts       # MODIFIED: buildSessionTrackerSection → replaced, buildInstructionsSection → plan steps added
│   └── generate.test.ts  # MODIFIED: Session Tracker tests updated for new plan-file instructions
```

### Pattern 1: Schema Type Design

**What:** Define TypeScript types for the migration plan that are clean enough for any coding agent to reproduce correctly.

**Recommended field names (Claude's discretion — choosing these):**

```typescript
// src/plan/types.ts

export type PlanStatus = 'pending' | 'in-progress' | 'complete';

export interface PlanItem {
  name: string;
  type: 'shared' | 'page' | 'section' | 'component';
  status: PlanStatus;
  notes?: string;            // optional agent annotations
  children?: PlanItem[];     // only on type: 'page' items
}

export interface MigrationPlan {
  version: '1.0';            // schema version for future-proofing
  generatedAt: string;       // ISO date string (for debugging, not display)
  items: PlanItem[];         // top-level: shared items first, then pages
}
```

**Why `version` and `generatedAt`:** Including a version field costs ~15 tokens in the brief JSON example but removes any ambiguity if the schema evolves. `generatedAt` is a metadata field (Claude's discretion — recommended to include). Neither creates any agent obligation to maintain them — they are read-only informational fields.

**Why no page-level `route` or `filename`:** The plan is intentionally minimal. The agent uses the brief for page details and the plan for progress tracking only. Cross-referencing by `name` is sufficient.

### Pattern 2: Skeleton Generator (Pure Function)

**What:** `generateMigrationPlan(siteAnalysis: SiteAnalysis): MigrationPlan` — no I/O, pure transformation.

```typescript
// src/plan/generate.ts
import type { SiteAnalysis } from '../analysis/types';
import type { MigrationPlan, PlanItem } from './types';

export function generateMigrationPlan(siteAnalysis: SiteAnalysis): MigrationPlan {
  const items: PlanItem[] = [];

  // Shared components first (top-level)
  if (siteAnalysis.sharedLayout.hasSharedNav) {
    items.push({ name: 'Shared Nav', type: 'shared', status: 'pending' });
  }
  if (siteAnalysis.sharedLayout.hasSharedFooter) {
    items.push({ name: 'Shared Footer', type: 'shared', status: 'pending' });
  }

  // Pages with children (sections and webflow components)
  const contentPages = siteAnalysis.pages.filter(
    (p) => !p.isCmsTemplate && !p.isUtilityPage,
  );
  for (const page of contentPages) {
    const children: PlanItem[] = page.sections.map((s) => ({
      name: s.label,
      type: 'section' as const,
      status: 'pending' as const,
    }));
    items.push({
      name: page.title,
      type: 'page',
      status: 'pending',
      children: children.length > 0 ? children : undefined,
    });
  }

  // CMS templates as pages (no children — no sections extracted)
  const cmsPages = siteAnalysis.pages.filter((p) => p.isCmsTemplate);
  for (const page of cmsPages) {
    items.push({
      name: `${page.title} (CMS Template)`,
      type: 'page',
      status: 'pending',
    });
  }

  return {
    version: '1.0',
    generatedAt: new Date().toISOString().slice(0, 10),
    items,
  };
}
```

**Note on `webflowComponents`:** The `SectionItem[]` (sections with tag/className/label) maps cleanly to children. `webflowComponents` (nav, slider, tabs) are page-level Webflow classes, not structural sections. They belong in the brief for migration guidance but not in the plan schema — the plan tracks structural sections, not component migration tasks. This keeps the plan simple and agent-reproducible.

### Pattern 3: File I/O (Mirror of saveBrief)

**What:** `saveMigrationPlan()` follows identical pattern to `saveBrief()` — base64 encode JSON string, write via shell.exec.

```typescript
// src/plan/io.ts
interface ShellLike {
  exec(cmd: string, args: string[]): Promise<{ exit_code: number; stdout: string; stderr: string }>;
}

export async function saveMigrationPlan(
  shell: ShellLike,
  projectPath: string,
  plan: MigrationPlan,
): Promise<void> {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const json = JSON.stringify(plan, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const result = await shell.exec('bash', [
    '-c',
    `echo '${encoded}' | base64 -d > '${planPath}'`,
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save migration plan: ${result.stderr}`);
  }
}
```

**File path:** `.shipstudio/migration-plan.json` (not under `/assets/` — it's a live progress file, not a static asset). The `.shipstudio/` directory is already created by the asset copy step.

### Pattern 4: Brief Instruction Replacement

**What:** Replace `buildSessionTrackerSection()` with new plan-file instructions. Add plan steps to the top of `buildInstructionsSection()`.

**Two changes to `generate.ts`:**

1. Remove `buildSessionTrackerSection()` call from `generateBrief()` sections array.
2. Add migration plan preamble at the top of `buildInstructionsSection()` output for BOTH modes.

**Brief preamble text (goes before the mode-specific "How to Use This Brief" content):**

```markdown
## Migration Plan

The file `.shipstudio/migration-plan.json` has been created for you. It contains all pages and sections from the site analysis with status `"pending"`.

**Before writing any code:**
1. Read `.shipstudio/migration-plan.json` to understand the full scope of work.
2. Do NOT recreate this file — it already exists. Do not overwrite it with a new structure.

**As you build:**
- Update each item's `status` from `"pending"` to `"in-progress"` when you start it.
- Update to `"complete"` when you finish and verify it.
- Use the optional `notes` field to record decisions: `"responsive done, animations pending"`.
- You may add new items (e.g., framework setup tasks) but keep the base structure intact.

**Example of the file format:**
```json
{
  "version": "1.0",
  "generatedAt": "2026-03-18",
  "items": [
    { "name": "Shared Nav", "type": "shared", "status": "pending" },
    { "name": "Shared Footer", "type": "shared", "status": "pending" },
    {
      "name": "Home",
      "type": "page",
      "status": "in-progress",
      "notes": "Hero section done, working on features",
      "children": [
        { "name": "Hero", "type": "section", "status": "complete" },
        { "name": "Features", "type": "section", "status": "in-progress" },
        { "name": "Call to Action", "type": "section", "status": "pending" }
      ]
    }
  ]
}
```
```

**Token estimate:** ~500 tokens for the preamble + JSON example — consistent with the user's stated budget for removing ambiguity.

### Pattern 5: MainView.tsx Integration

**What:** After `saveBrief()` succeeds, generate and save the migration plan.

```typescript
// In handleSelectZip, after saveBrief:
const plan = generateMigrationPlan(siteAnalysis);
await saveMigrationPlan(shell, projectPath, plan);
```

**Both operations use the same `shell` instance and `projectPath`.** No new state needed in MainView — the plan file is written silently as part of brief generation. The `done` step state does not need a `planResult` field — the plan file is an output artifact, not rendered in UI (that's Phase 7's job).

### Anti-Patterns to Avoid

- **Including webflowComponents in plan children:** They are migration guidance (belongs in brief), not structural sections (belongs in plan). Mixing them makes the plan harder for agents to maintain.
- **Putting the plan under `.shipstudio/assets/`:** Assets are static, the plan is live. Wrong directory would confuse Phase 7 polling.
- **Making `generateBrief()` return the plan JSON:** The plan is an independent artifact. Keep `BriefResult` type clean — plan generation happens separately in `MainView.tsx` pipeline.
- **Complex error handling for malformed plan reads:** Phase 6 only writes the file. Reads are Phase 7's concern. Keep Phase 6 error handling simple: throw on write failure, same as `saveBrief()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON encoding for shell exec | Custom escaping logic | `JSON.stringify` + existing base64 encode pattern | The `btoa(unescape(encodeURIComponent(...)))` pattern already handles all edge cases including unicode, pipes, backticks. Verified in io.test.ts. |
| Schema versioning | Custom version tracking | Simple `version: '1.0'` string literal in type | Sufficient for current needs, easy to increment if schema changes |

**Key insight:** The hardest part of this phase is already solved. File I/O works, analysis data is structured, and the brief pipeline is well-tested. This phase is primarily schema design + plumbing.

---

## Common Pitfalls

### Pitfall 1: Session Tracker Tests Will Break

**What goes wrong:** `generate.test.ts` has 5 tests asserting on `## Session Tracker` content. Replacing `buildSessionTrackerSection()` with plan-file instructions means all 5 break.

**Why it happens:** Tests assert on specific section names and checkbox formats that no longer exist.

**How to avoid:** Update tests alongside the code change. New tests should assert:
- `## Migration Plan` section exists (replaces `## Session Tracker`)
- Brief contains `.shipstudio/migration-plan.json` reference
- Brief does NOT contain `## Session Tracker` (regression guard)
- Brief does NOT contain `MIGRATION_LOG.md` (old tracker format gone)

**Warning signs:** Running `npx vitest run` before updating tests will show 5 failures immediately.

### Pitfall 2: Plan File Path Outside Existing Directory

**What goes wrong:** Writing to `.shipstudio/migration-plan.json` assumes the directory exists. If `.shipstudio/` hasn't been created yet, the write fails.

**Why it happens:** `saveBrief()` writes to `.shipstudio/assets/brief.md` — the `/assets/` subdirectory is created by the asset copy step. The plan file is at the `.shipstudio/` level, not inside `/assets/`.

**How to avoid:** Check when in the pipeline `.shipstudio/` is first created. In `MainView.tsx`, asset copy (Step 4) creates `.shipstudio/assets/`. The `.shipstudio/` parent is created at that point. Plan file write (Step 6, after brief) will have a valid parent directory. Verify this assumption by checking `copyAssets()` implementation, or use `mkdir -p` in the shell command as a safety guard.

**Warning signs:** Non-zero exit code from `saveMigrationPlan()` in a fresh project with no previous plugin run.

### Pitfall 3: The JSON Example in Brief Becomes Stale

**What goes wrong:** The hardcoded JSON example in the brief preamble shows a specific structure. If the schema types change, the example drifts from reality.

**Why it happens:** The example is a static markdown string, not generated from the actual plan.

**How to avoid:** For Phase 6, the schema is being designed fresh — the example will match at implementation time. Long-term (future phases), consider generating the example from a minimal mock SiteAnalysis. This is low risk for now since the schema is intentionally stable.

**Warning signs:** Brief example shows fields that don't match what `generateMigrationPlan()` actually produces.

### Pitfall 4: Utility Pages in the Plan

**What goes wrong:** `SiteAnalysis.pages[]` includes utility pages (`isUtilityPage: true`) like 404, search, etc. Including them in the plan inflates scope and confuses agents.

**Why it happens:** The same filter logic needed in `buildSessionTrackerSection()` (which already filters `isUtilityPage`) must be replicated in `generateMigrationPlan()`.

**How to avoid:** Filter identically to the existing Session Tracker logic:
```typescript
const contentPages = pages.filter((p) => !p.isCmsTemplate && !p.isUtilityPage);
const cmsPages = pages.filter((p) => p.isCmsTemplate);
// Utility pages: excluded entirely
```

---

## Code Examples

### Existing saveBrief Pattern (Model for saveMigrationPlan)

```typescript
// Source: src/brief/io.ts — verified by reading source
export async function saveBrief(shell, projectPath, markdown) {
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', [
    '-c',
    `echo '${encoded}' | base64 -d > '${briefPath}'`,
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save brief: ${result.stderr}`);
  }
}
```

### Existing Session Tracker Structure (Being Replaced)

```typescript
// Source: src/brief/generate.ts — the function being replaced
function buildSessionTrackerSection(pages, sharedLayout) {
  // Currently generates markdown checklist with - [ ] per page
  // This entire function is REPLACED by plan-file instructions in Phase 6
  // Tests asserting on '## Session Tracker' must be updated
}
```

### MainView Pipeline Insertion Point

```typescript
// Source: src/views/MainView.tsx — Step 6, after saveBrief
// Current code (lines 148-162):
briefResult = generateBrief({ mode, siteAnalysis, assetManifest, projectPath, ... });
await saveBrief(shell, projectPath, briefResult.markdown);
// Phase 6 adds here:
const plan = generateMigrationPlan(siteAnalysis);
await saveMigrationPlan(shell, projectPath, plan);
```

### Test Pattern for io.test.ts (Mirror of brief/io.test.ts)

```typescript
// Follows src/brief/io.test.ts pattern exactly
describe('saveMigrationPlan', () => {
  it('calls shell.exec with bash as first arg', ...);
  it('command contains base64 -d', ...);
  it('command contains correct plan path: .shipstudio/migration-plan.json', ...);
  it('throws on non-zero exit code with "Failed to save migration plan"', ...);
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session Tracker markdown checklist in brief | `migration-plan.json` file, plugin-written skeleton | Phase 6 | Single source of truth; machine-readable for Phase 7 progress UI |
| Agent creates plan file as first action | Plugin creates skeleton, agent reads + maintains | CONTEXT.md decision | Eliminates "waiting for plan" state; plan available immediately |

**Deprecated/outdated:**
- `buildSessionTrackerSection()` in `generate.ts`: removed and replaced by plan-file preamble instructions.
- `MIGRATION_LOG.md` instructions in the Session Tracker section: not replaced in the brief — this concept is simply dropped. The plan file is the log.

---

## Open Questions

1. **Does `.shipstudio/` directory exist before plan file write?**
   - What we know: `saveBrief()` writes to `.shipstudio/assets/brief.md` and the asset copy step creates `.shipstudio/assets/`. The parent `.shipstudio/` must exist.
   - What's unclear: Whether `copyAssets()` creates `.shipstudio/` explicitly or only `assets/` under it.
   - Recommendation: Add `mkdir -p '${projectPath}/.shipstudio'` as a safety guard in the `saveMigrationPlan` shell command, or verify by reading `src/assets/copy.ts`. Safe to include — `mkdir -p` is idempotent.

2. **Should `webflowComponents` appear as children in the plan?**
   - What we know: They are per-page items but are migration guidance (what Webflow class to replace, how to replace it), not structural page sections.
   - What's unclear: Whether Phase 7 progress UI will want to show component migration progress separately.
   - Recommendation: Exclude from Phase 6 plan. Keep plan minimal. Phase 7 can surface component data from the brief's Pages section. If Phase 7 needs them, the plan schema can be extended then.

---

## Validation Architecture

> `nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (includes `src/**/*.test.ts`) |
| Quick run command | `npx vitest run src/plan/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAN-01 | Brief contains migration plan preamble with plan file path and read/maintain instructions | unit | `npx vitest run src/brief/generate.test.ts` | ✅ (needs updates) |
| PLAN-01 | Brief does NOT contain `## Session Tracker` (regression) | unit | `npx vitest run src/brief/generate.test.ts` | ✅ (needs new test) |
| PLAN-02 | `generateMigrationPlan()` produces pages with nested children from SiteAnalysis sections | unit | `npx vitest run src/plan/generate.test.ts` | ❌ Wave 0 |
| PLAN-02 | Each item has `status: 'pending'` in skeleton output | unit | `npx vitest run src/plan/generate.test.ts` | ❌ Wave 0 |
| PLAN-03 | Shared nav/footer appear as top-level items when SharedLayout flags are true | unit | `npx vitest run src/plan/generate.test.ts` | ❌ Wave 0 |
| PLAN-03 | Shared items absent when SharedLayout flags are false | unit | `npx vitest run src/plan/generate.test.ts` | ❌ Wave 0 |
| PLAN-04 | Brief instructions explicitly tell agent to update status as items complete | unit | `npx vitest run src/brief/generate.test.ts` | ✅ (needs new test) |
| — | `saveMigrationPlan()` calls shell.exec with correct path and base64 pattern | unit | `npx vitest run src/plan/io.test.ts` | ❌ Wave 0 |
| — | `saveMigrationPlan()` throws on non-zero exit code | unit | `npx vitest run src/plan/io.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/plan/ src/brief/generate.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/plan/generate.test.ts` — covers PLAN-02, PLAN-03 skeleton generation
- [ ] `src/plan/io.test.ts` — covers file write behavior (mirrors `src/brief/io.test.ts`)
- [ ] `src/plan/types.ts` — types file (not a test, but required before generate.test.ts can import)
- [ ] `src/plan/generate.ts` — implementation (required before generate.test.ts can import)
- [ ] `src/plan/io.ts` — implementation (required before io.test.ts can import)

Existing test infrastructure: Vitest is installed and configured. `src/brief/generate.test.ts` and `src/brief/io.test.ts` exist and run. Framework setup is complete — only new files needed.

---

## Sources

### Primary (HIGH confidence)

- `src/brief/generate.ts` — Direct source read. `buildSessionTrackerSection()` full implementation understood; `generateBrief()` section assembly understood; `buildInstructionsSection()` modification point identified.
- `src/brief/types.ts` — Direct source read. `BriefInput`, `BriefResult` types confirmed. No changes needed to BriefResult for Phase 6.
- `src/analysis/types.ts` — Direct source read. `SiteAnalysis`, `PageInfo`, `SectionItem`, `SharedLayout` types confirmed. Full schema mapping is possible with existing data.
- `src/brief/io.ts` — Direct source read. `saveBrief()` pattern confirmed. `saveMigrationPlan()` is a direct structural copy.
- `src/views/MainView.tsx` — Direct source read. Pipeline insertion point confirmed (after `saveBrief()`, before `setStep({ kind: 'done' })`).
- `src/brief/generate.test.ts` — Direct source read. 5 Session Tracker tests identified that will need updating.
- `src/brief/io.test.ts` — Direct source read. Test pattern confirmed for mirroring in `src/plan/io.test.ts`.
- `vitest.config.ts` — Direct source read. `include: ['src/**/*.test.ts']` — new test files auto-discovered.
- `.planning/config.json` — Direct source read. `nyquist_validation: true`.

### Secondary (MEDIUM confidence)

- `06-CONTEXT.md` — User decisions document, read directly. All locked decisions treated as authoritative constraints.
- `REQUIREMENTS.md` — PLAN-01 through PLAN-04 requirements confirmed and mapped.
- `STATE.md` — Confirmed blockers: schema simplicity and test non-regression.

### Tertiary (LOW confidence)

- None. All findings are from direct source reads.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already in project, no new dependencies
- Architecture: HIGH — patterns directly derived from existing codebase source reads
- Schema design: HIGH — SiteAnalysis types read directly, mapping is clear
- Pitfalls: HIGH — test breakage is certain (Session Tracker tests exist and will fail); directory assumption is verified by pipeline order
- Test mapping: HIGH — test framework configured, existing test files read

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain — no external dependencies to go stale)
