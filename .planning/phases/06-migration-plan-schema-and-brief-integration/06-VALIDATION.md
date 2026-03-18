---
phase: 6
slug: migration-plan-schema-and-brief-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 6 — Validation Strategy

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
| 06-01-01 | 01 | 1 | PLAN-02, PLAN-03 | unit | `npx vitest run src/plan/generate.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | PLAN-02, PLAN-03 | unit | `npx vitest run src/plan/generate.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | PLAN-01, PLAN-04 | unit | `npx vitest run src/brief/generate.test.ts` | ✅ | ⬜ pending |
| 06-02-02 | 02 | 2 | PLAN-01 | integration | `npx vitest run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/plan/generate.test.ts` — stubs for plan schema generation tests (PLAN-02, PLAN-03)
- [ ] `src/plan/io.test.ts` — stubs for plan file I/O tests

*Existing `src/brief/generate.test.ts` and `src/brief/io.test.ts` cover brief generation changes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plan file written to project directory | PLAN-01 | Requires shell.exec in Ship Studio runtime | Run plugin in Ship Studio, verify `.shipstudio/migration-plan.json` exists after brief generation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
