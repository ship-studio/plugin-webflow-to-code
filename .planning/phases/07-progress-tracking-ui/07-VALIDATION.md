---
phase: 7
slug: progress-tracking-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PROG-04 | unit | `npx vitest run src/plan/read.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | PROG-01, PROG-03 | unit | `npx vitest run src/plan/read.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | PROG-01, PROG-02, PROG-03 | manual | Ship Studio visual | N/A | ⬜ pending |
| 07-02-02 | 02 | 2 | PROG-04 | manual | Ship Studio visual | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/plan/read.test.ts` — stubs for loadMigrationPlan and computeProgress tests

*No component testing infrastructure exists; MigrationProgress component verified manually.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Expandable page list renders correctly | PROG-01, PROG-02 | React component rendering in Ship Studio runtime | Open plugin, generate brief, verify page list with expand/collapse |
| Progress bar shows correct percentage | PROG-03 | Visual rendering | Compare bar fill with computed percentage from plan file |
| Auto-refresh updates UI | PROG-04 | Requires live agent modifying plan file | Run agent, watch plugin for 30s refresh cycles |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
