---
phase: 4
slug: site-analysis
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (configured) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/analysis/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/analysis/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 04-01 | 1 | PAGE-01 | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 04-01 | 1 | PAGE-02 | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 04-01 | 1 | WFLW-03 | unit | `npx vitest run src/analysis/parse.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 04-02 | 1 | WFLW-01 | unit | `npx vitest run src/analysis/webflow.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 04-02 | 1 | WFLW-02 | unit | `npx vitest run src/analysis/webflow.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 04-03 | 2 | PAGE-04 | unit | `npx vitest run src/analysis/shared.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 04-03 | 2 | PAGE-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/analysis/types.ts` — type definitions
- [ ] `src/analysis/parse.test.ts` — PAGE-01, PAGE-02, WFLW-03 (needs `// @vitest-environment jsdom`)
- [ ] `src/analysis/webflow.test.ts` — WFLW-01, WFLW-02 (needs `// @vitest-environment jsdom`)
- [ ] `src/analysis/shared.test.ts` — PAGE-04 (needs `// @vitest-environment jsdom`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Analysis progress label in modal | PAGE-01 | Visual verification | Select zip → observe "Analyzing pages..." step |
| All pages listed in done state | PAGE-01 | Visual verification | Verify page count matches expected |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
