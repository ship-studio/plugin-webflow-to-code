---
phase: 5
slug: brief-generation-and-full-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest v4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/brief/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/brief/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 05-01 | 1 | BREF-02 | unit | `npx vitest run src/brief/generate.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 05-01 | 1 | BREF-03 | unit | `npx vitest run src/brief/generate.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 05-01 | 1 | BREF-04 | unit | `npx vitest run src/brief/generate.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 05-02 | 2 | BREF-01 | unit | `npx vitest run && npx tsc --noEmit` | N/A | ⬜ pending |
| TBD | 05-02 | 2 | BREF-04 | manual | Open plugin, run full pipeline, check results panel | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/brief/generate.test.ts` — covers BREF-02, BREF-03, BREF-04 (needs `// @vitest-environment jsdom`)
- [ ] `src/brief/io.test.ts` — covers saveBrief and copyToClipboard shell.exec verification

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full pipeline produces brief.md | BREF-04 | Requires Ship Studio + real zip | Run full pipeline → check .shipstudio/assets/brief.md exists |
| Results panel shows token count and path | BREF-04 | Visual verification | Observe results after generation |
| Mode selector locked during pipeline | BREF-01 | Visual verification | Start pipeline → verify mode cards disappear/disable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
