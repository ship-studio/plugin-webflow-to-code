---
phase: 1
slug: plugin-scaffolding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — smoke tests via inline Node.js commands |
| **Config file** | none — no framework install needed |
| **Quick run command** | `npm run build && node -e "const b=require('fs').readFileSync('dist/index.js','utf8'); console.log('Bundle size:', b.length, 'bytes'); if(!b.includes('__SHIPSTUDIO_REACT__')) throw new Error('React not externalized');"` |
| **Full suite command** | `npm run build && node -e "const fs=require('fs'); const b=fs.readFileSync('dist/index.js','utf8'); if(!b.includes('__SHIPSTUDIO_REACT__')||b.length>100000) process.exit(1); const m=JSON.parse(fs.readFileSync('plugin.json','utf8')); if(m.id!=='webflow-to-code'||m.api_version!==1||!m.slots.includes('toolbar')) process.exit(1); console.log('All smoke checks passed');"` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | INFR-02 | smoke | `ls vite.config.ts tsconfig.json plugin.json` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFR-01 | smoke | `node -e "const b=require('fs').readFileSync('dist/index.js','utf8'); if(b.includes('__SHIPSTUDIO_REACT__')&&b.length<100000) process.exit(0); process.exit(1);"` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFR-02 | smoke | `node -e "const m=JSON.parse(require('fs').readFileSync('plugin.json','utf8')); if(m.id!=='webflow-to-code'||m.api_version!==1||!m.slots.includes('toolbar')) process.exit(1);"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Smoke checks run inline via Node.js — no test framework install needed
- [ ] `npm run build` must succeed before any smoke check

*Existing infrastructure covers all phase requirements via inline smoke commands.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin appears in Ship Studio toolbar | INFR-01 | Requires running Ship Studio app | Link Dev Plugin → verify toolbar icon renders |
| Modal opens on toolbar click | INFR-01 | Requires Ship Studio runtime | Click toolbar button → verify modal opens without errors |
| Modal renders mode cards + file picker placeholder | INFR-01 | Visual verification | Open modal → verify two mode cards and disabled file picker visible |
| No console errors on load | INFR-01 | Requires Ship Studio dev tools | Cmd+Option+I → check console for errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
