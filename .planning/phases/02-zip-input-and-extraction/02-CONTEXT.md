# Phase 2: Zip Input and Extraction - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up the file picker button (currently disabled in MainView.tsx), let users select a Webflow export .zip, extract it to a temp directory, validate it's a real Webflow export, and show step-by-step progress with file counts. This phase does NOT copy assets to `.shipstudio/assets/` (Phase 3) or analyze HTML (Phase 4) — it only extracts and validates.

</domain>

<decisions>
## Implementation Decisions

### File Picker Mechanics
- Claude's discretion on the exact mechanism (HTML `<input type="file">`, Tauri open dialog via `invoke.call`, or whatever works reliably in Ship Studio's Tauri context)
- The key constraint: must produce a filesystem path that can be passed to `shell.exec('unzip', ...)`
- Known concern from STATE.md: `<input type="file">` in Tauri may not expose a filesystem path — research should investigate this
- Re-run behavior: Claude's discretion (overwrite vs side-by-side) — pick the pragmatic approach

### Validation Rules
- Check for Webflow-specific signatures: `data-wf-site` attribute in HTML, `webflow.js` in js/ directory
- Don't require optional directories (videos/, fonts/, legal/) — those vary between exports
- Do require at least one .html file and a css/ directory
- Error messages must be specific and actionable: tell the user exactly what's missing ("No HTML files found", "Missing CSS directory — is this a Webflow export?", "No data-wf-site attribute found — this may not be a Webflow export")

### Progress UX
- Step labels with file counts: "Extracting zip... (66 files)" → "Validating export..." → "Done"
- Progress updates inline in the modal (replaces the file picker area during extraction)
- Errors display inline in the modal — red text with specific message and a retry button
- No toast notifications for errors — keep everything in the modal context

### Claude's Discretion
- Exact file picker implementation approach (HTML input vs Tauri dialog)
- Temp directory location and cleanup strategy
- Re-run behavior (overwrite previous extraction vs keep)
- Whether to show individual file names during extraction or just counts
- Extraction timeout handling for large zips

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plugin Architecture & API
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-starter/CLAUDE.md` — Plugin API reference: shell.exec, invoke.call, storage, actions
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/types.ts` — PluginContextValue interface with Shell, Storage types
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/context.ts` — usePluginContext() hook

### Current Implementation (Phase 1 output)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/views/MainView.tsx` — Current MainView with disabled file picker button (modify this)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/styles.ts` — Plugin CSS (add progress/error styles here)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/index.tsx` — Plugin entry point

### Sibling Plugin Patterns
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/views/MainView.tsx` — Reference for state machine pattern, error handling, shell.exec usage
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-figma/src/brief/io.ts` — Reference for base64 shell encoding trick for file I/O

### Webflow Export Structure
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/moneystack-website.webflow.zip` — Sample Webflow export for testing (66 files, 35MB)

### Research
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/.planning/research/ARCHITECTURE.md` — Data flow, module boundaries, shell.exec patterns
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/.planning/research/PITFALLS.md` — File picker path access concern, extraction timeout risks

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/context.ts`: `usePluginContext()` hook — provides shell, storage, actions, project
- `src/types.ts`: Full Shell interface typed (`exec(command, args[], options?)`)
- `src/components/Modal.tsx`: Modal wrapper with overlay, escape, click-outside
- `src/styles.ts`: CSS injection lifecycle (STYLE_ID pattern)
- Host CSS class `btn-primary`: use for buttons (learned from Phase 1 CSS fix — don't use custom button styles)

### Established Patterns
- All file ops through `shell.exec` — no direct FS access
- `wf2c-` CSS prefix for all plugin-scoped styles
- Mode state already managed in MainView (`useState<Mode>`)
- Figma plugin uses `useRef` for shell reference to avoid re-renders

### Integration Points
- MainView.tsx line 32: disabled button to be wired up
- `src/zip/` directory exists (`.gitkeep` placeholder) — implementation goes here
- `shell.exec('unzip', ...)` for extraction
- `shell.exec('unzip', ['-l', zipPath])` for file listing/validation

</code_context>

<specifics>
## Specific Ideas

- Progress should show file counts: "Extracting zip... (66 files)" not just "Extracting zip..."
- Validation checks for Webflow signatures specifically (`data-wf-site`, `webflow.js`) — not just generic "has HTML"
- Error messages guide the user: "No data-wf-site attribute found — this may not be a Webflow export"
- Errors show inline in the modal with retry option, not as toasts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-zip-input-and-extraction*
*Context gathered: 2026-03-16*
