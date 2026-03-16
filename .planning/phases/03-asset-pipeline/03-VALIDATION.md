---
phase: 3
slug: asset-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (configured in vitest.config.ts) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/assets/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/assets/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 03-01 | 1 | ASST-01 | unit | `npx vitest run src/assets/copy.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 03-01 | 1 | ASST-02 | unit | `npx vitest run src/assets/manifest.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 03-01 | 1 | ASST-03 | unit | `npx vitest run src/assets/manifest.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/assets/copy.test.ts` — covers ASST-01 (copy orchestration, directory-exists guard)
- [ ] `src/assets/manifest.test.ts` — covers ASST-02, ASST-03 (manifest building, grouping, purpose inference)
- [ ] Reuse `createMockShell()` pattern from `src/zip/extract.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Assets appear in .shipstudio/assets/ after extraction | ASST-01 | Requires running plugin in Ship Studio | Select zip → verify files in .shipstudio/assets/ |
| Progress label shows "Copying assets..." step | ASST-01 | Visual verification | Select zip → observe copying step label |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
