---
phase: 2
slug: zip-input-and-extraction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` — Wave 0 creates |
| **Quick run command** | `npx vitest run src/zip/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/zip/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 02-01 | 0 | ZIP-01 | unit | `npx vitest run src/zip/extract.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 02-01 | 0 | ZIP-02 | unit | `npx vitest run src/zip/extract.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 02-01 | 0 | ZIP-03 | unit | `npx vitest run src/zip/discover.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 02-01 | 1 | ZIP-04 | manual | Open plugin, select zip, observe progress labels | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest` — test framework not yet in package.json
- [ ] `vitest.config.ts` — minimal config
- [ ] `src/zip/extract.test.ts` — unit tests for osascript file picker and unzip extraction
- [ ] `src/zip/discover.test.ts` — unit tests for manifest parsing and Webflow validation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File picker opens native macOS dialog | ZIP-01 | Requires osascript + UI interaction | Click button → verify native file picker opens |
| Progress labels update in modal | ZIP-04 | Visual verification in Ship Studio | Select zip → observe step labels with file counts |
| Error displays inline on invalid zip | ZIP-03 | Visual verification | Select non-Webflow zip → verify inline error with specific message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
