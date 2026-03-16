# Phase 2: Zip Input and Extraction - Research

**Researched:** 2026-03-16
**Domain:** File picker mechanics in Ship Studio (Tauri/WKWebView), shell.exec unzip patterns, Webflow export validation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Validation rules:** Check for `data-wf-site` attribute in HTML and `webflow.js` in `js/` directory. Do not require optional directories (videos/, fonts/, legal/). Do require at least one `.html` file and a `css/` directory.
- **Error messages:** Must be specific and actionable — "No HTML files found", "Missing CSS directory — is this a Webflow export?", "No data-wf-site attribute found — this may not be a Webflow export"
- **Progress UX:** Step labels with file counts: "Extracting zip... (66 files)" → "Validating export..." → "Done"
- **Progress placement:** Updates inline in the modal (replaces the file picker area during extraction)
- **Error placement:** Inline in the modal with red text, specific message, and a retry button — no toasts for errors

### Claude's Discretion
- Exact file picker implementation approach (HTML input vs Tauri dialog)
- Temp directory location and cleanup strategy
- Re-run behavior (overwrite previous extraction vs keep)
- Whether to show individual file names during extraction or just counts
- Extraction timeout handling for large zips

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ZIP-01 | User can select a Webflow export .zip via file picker in the plugin modal | File picker resolved: osascript via shell.exec is the only viable path — see "Critical Finding" section |
| ZIP-02 | Plugin extracts zip contents to a temp directory via shell.exec unzip | Confirmed: `shell.exec('unzip', ['-o', zipPath, '-d', tmpDir])` with 5-min timeout; verify file count post-extraction |
| ZIP-03 | Plugin validates zip structure (checks for index.html, CSS files) and shows clear error for malformed exports | Confirmed: validated against real Webflow zip; `data-wf-site` attribute in index.html is the definitive Webflow signature |
| ZIP-04 | Plugin shows step-by-step progress labels during processing | Pattern established from Figma plugin; step-based state drives label and file count display |
</phase_requirements>

---

## Summary

The two largest technical risks for this phase are now resolved: the file picker path access problem (confirmed: `<input type="file">` does NOT expose a filesystem path in Tauri's WKWebView) and the validated extraction/verification pattern.

**File picker:** `<input type="file">` is not viable for this use case. The `File` object from a browser file input only exposes `name`, `size`, and `type` — not a filesystem path — in WKWebView (Tauri's macOS renderer). This is a documented limitation of WKWebView. The solution is `shell.exec('osascript', ['-e', "POSIX path of (choose file with prompt \"Select Webflow export zip\" of type {\"zip\"})"])`, which opens a native macOS file picker and returns the full absolute path. User cancellation returns exit code 1 with stderr containing "User canceled. (-128)" — detectable and handled gracefully.

**Zip extraction:** Use `shell.exec('unzip', ['-o', zipPath, '-d', tmpDir])` with `{ timeout: 300000 }` (5 minutes for video-heavy zips). After extraction, verify file count against `unzip -l` output to catch silent partial extraction failures. The `unzip -l` output format is fixed-width: filename starts at character position 32+ on each data row.

**Primary recommendation:** Use `osascript choose file` via `shell.exec` for the file picker; extract to `.shipstudio/tmp/` under `project.path`; overwrite on re-run; validate with `grep data-wf-site` on index.html.

---

## Critical Finding: File Picker Path Access

### The Problem

The CONTEXT.md and PITFALLS.md both flagged this as the phase's primary unknown: does `<input type="file">` in Ship Studio's Tauri WebView expose a filesystem path?

**Confirmed: No, it does not.**

- WKWebView (macOS) and WebView2 (Windows/Linux) follow the browser security model: `File` objects from `<input type="file">` expose only `name`, `size`, `type`, and `lastModified`. There is no `path` or `webkitPath` property.
- This is a long-standing, intentional limitation documented in wry issue #87 (Tauri's WebView library). Tauri/wry explicitly chose NOT to add a path property (unlike Electron) because it violates the web security model.
- `webkitRelativePath` is only populated when using `<input webkitdirectory>` for folder selection — not for individual file selection — and only gives the relative path within the selected folder, not the absolute system path.
- No existing Ship Studio plugin uses a file picker — none of the 14 sibling plugins have `<input type="file">` in their source.

### The Solution: osascript via shell.exec

**Use `shell.exec` to call `osascript` and open a native macOS file dialog:**

```typescript
// Source: direct testing + Apple Developer docs
const result = await shell.exec('osascript', [
  '-e',
  'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})'
]);

if (result.exit_code !== 0) {
  // User cancelled: stderr contains "User canceled. (-128)"
  // Any other error: surface message
  if (result.stderr.includes('-128')) {
    // user cancelled — no error, just ignore
    return;
  }
  throw new Error(`Could not open file picker: ${result.stderr}`);
}

const zipPath = result.stdout.trim(); // Absolute path, e.g. /Users/name/Downloads/site.zip
```

**Why this works:**
- `osascript` is available on all macOS systems (Ship Studio is macOS-only based on context)
- `choose file of type {"zip"}` filters to .zip files only
- Returns the absolute POSIX path directly in stdout
- Cancellation produces exit code 1 with recognizable stderr text
- `shell.exec` runs in the project context, but `osascript` is a system command — path access is not scoped to the project directory

**Confidence:** HIGH — `osascript` is a stable macOS system utility, confirmed working in the shell environment of this machine, and is the standard approach used in automation scripts when native dialog is needed from a non-GUI-app context.

### Why Not invoke.call()

The available `required_commands` in Ship Studio's `invoke.call()` API (from CLAUDE.md section 5) does not include any file dialog command. The full available command set covers git operations, project reads, IDE operations, and plugin self-management only. There is no `open_file_dialog`, `plugin:dialog|open`, or equivalent. Adding commands to `required_commands` only works for commands the host app exposes — plugins cannot register new Tauri commands.

---

## Standard Stack

### Core (Phase 2)
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| `shell.exec` (built-in) | Ship Studio API | All file I/O including unzip and osascript | Only available FS access mechanism |
| `unzip` (system) | macOS built-in | Zip extraction | Available on all macOS systems; no install needed |
| `osascript` (system) | macOS built-in | Native file picker dialog | Only way to get a real FS path from user selection in Tauri |
| React `useState` | 19.x (host) | Step/error/progress UI state | Already externalized; no bundle cost |
| `useRef` | 19.x (host) | Stable shell reference across re-renders | Pattern established in Figma plugin |

### No New npm Dependencies Needed
This phase requires zero new npm packages. All capabilities come from:
- `shell.exec` (Ship Studio API, already wired)
- `usePluginContext()` (already in `src/context.ts`)
- `unzip` and `osascript` (macOS system tools)

**Installation:** Nothing to install.

---

## Architecture Patterns

### Recommended File Structure (this phase)
```
src/
├── views/
│   └── MainView.tsx         # Modify: wire file picker button, add progress/error states
├── zip/
│   ├── extract.ts           # New: shell.exec unzip, count verification
│   ├── discover.ts          # New: parse unzip -l manifest, categorize entries
│   └── types.ts             # New: ZipContents, ZipEntry
└── styles.ts                # Modify: add progress and error CSS classes
```

### Pattern 1: osascript File Picker
**What:** `shell.exec('osascript', ['-e', 'POSIX path of (choose file ...)'])` to open a native macOS file picker.
**When to use:** Whenever a filesystem path is needed from user selection.
**Example:**
```typescript
// src/zip/extract.ts
export async function pickZipFile(shell: Shell): Promise<string | null> {
  const result = await shell.exec('osascript', [
    '-e',
    'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})'
  ]);
  if (result.exit_code !== 0) {
    if (result.stderr.includes('-128')) return null; // user cancelled
    throw new Error(`File picker error: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}
```

### Pattern 2: Extraction with File Count Verification
**What:** Run `unzip -l` first to get expected file count, then extract, then count actual files to detect silent failures.
**When to use:** Every extraction — the PITFALLS research confirmed silent partial extraction is a real risk with Unicode filenames and large video files.
**Example:**
```typescript
// Source: PITFALLS.md and ARCHITECTURE.md
export async function extractZip(
  shell: Shell,
  zipPath: string,
  extractDir: string
): Promise<ZipContents> {
  // 1. Get expected file count from manifest
  const listResult = await shell.exec('unzip', ['-l', zipPath]);
  if (listResult.exit_code !== 0) throw new Error(`Cannot read zip: ${listResult.stderr}`);
  const expectedCount = parseUnzipManifest(listResult.stdout);

  // 2. Extract (5-min timeout for video-heavy zips)
  const extractResult = await shell.exec(
    'unzip', ['-o', zipPath, '-d', extractDir],
    { timeout: 300000 }
  );
  if (extractResult.exit_code !== 0) {
    throw new Error(`Extraction failed: ${extractResult.stderr}`);
  }

  // 3. Verify file count
  const countResult = await shell.exec('bash', [
    '-c', `find '${extractDir}' -type f | wc -l | tr -d ' '`
  ]);
  const actualCount = parseInt(countResult.stdout.trim(), 10);
  if (actualCount < expectedCount.fileCount - 1) { // -1 tolerance for directory entries
    throw new Error(
      `Extraction incomplete: expected ${expectedCount.fileCount} files, got ${actualCount}. Some files may be corrupted.`
    );
  }

  return discoverContents(extractDir, expectedCount);
}
```

### Pattern 3: unzip -l Manifest Parsing
**What:** Parse `unzip -l` stdout to extract file count and build a file list WITHOUT extracting.
**When to use:** Pre-extraction validation + file count display ("Extracting zip... (66 files)").

`unzip -l` output format:
```
  Length      Date    Time    Name
---------  ---------- -----   ----
        0  02-04-2026 22:37   css/
     7772  02-04-2026 22:37   css/normalize.css
---------                     -------
 35767120                     66 files
```
- Data rows: the filename starts after the date/time columns, reliably at column index ~29 (after 3 spaces + time + 3 spaces)
- Summary row: last line before blank contains "N files" — extract with regex `/(\d+) files/`
- **Do not use `.split(' ')` on rows** — filenames with spaces break this. Use column positions or the summary line.

```typescript
function parseUnzipManifest(stdout: string): { fileCount: number; entries: string[] } {
  const lines = stdout.split('\n');
  const entries: string[] = [];

  for (const line of lines) {
    // Skip header, separator, and summary lines
    if (line.match(/^-{5,}/) || line.match(/Length\s+Date/) || line.trim() === '') continue;
    // Filename is everything after the 4th column (position ~28-32)
    const match = line.match(/^\s*\d+\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/);
    if (match) entries.push(match[1].trim());
  }

  // Extract total from summary: "  35767120                     66 files"
  const summaryMatch = stdout.match(/(\d+) files/);
  const fileCount = summaryMatch ? parseInt(summaryMatch[1], 10) : entries.length;

  return { fileCount, entries };
}
```

### Pattern 4: Step-Based Progress State
**What:** A union type drives which UI is shown — idle, picking, extracting, validating, done, error.
**When to use:** Replaces the file picker button area inline during extraction.

```typescript
type ZipStep =
  | { kind: 'idle' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number }
  | { kind: 'error'; message: string };

// In MainView.tsx - drive label from step:
const stepLabel: Record<ZipStep['kind'], string> = {
  idle:        '',
  extracting:  `Extracting zip...`,
  validating:  'Validating export...',
  done:        'Done',
  error:       '',
};
// For 'extracting', append file count: `Extracting zip... (${step.fileCount} files)`
```

### Pattern 5: Temp Directory Strategy (Claude's Discretion — Recommendation)
**Recommendation: Overwrite on re-run, use a fixed name based on zip filename.**

```typescript
// Temp dir: <project.path>/.shipstudio/tmp/<zip-base-name>/
// e.g. /Users/foo/my-project/.shipstudio/tmp/moneystack-website/
function buildExtractDir(projectPath: string, zipPath: string): string {
  const zipBaseName = zipPath.split('/').pop()!
    .replace(/\.zip$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 60);
  return `${projectPath}/.shipstudio/tmp/${zipBaseName}`;
}
```

Overwrite rationale: `unzip -o` (overwrite) is simpler than side-by-side, avoids stale temp directories multiplying, and the user explicitly re-runs to refresh. Use `mkdir -p` before extraction.

### Anti-Patterns to Avoid
- **`<input type="file">` for path access:** Returns a `File` object without a path property in WKWebView — completely unusable for `shell.exec('unzip', ...)`. Do not implement this.
- **Trusting `exit_code === 0` alone:** `unzip` can return 0 with partial extraction and non-empty stderr. Always verify file count AND check stderr.
- **Default 120s timeout for unzip:** The sample zip is 35MB with video files. Use `{ timeout: 300000 }` for the extraction step.
- **`.split(' ')` parsing of `unzip -l`:** Filenames with spaces break this. Use regex column matching.
- **Uncleaned temp dirs:** They accumulate across projects. Overwrite (not accumulate) using a fixed derived name.

---

## Webflow Export Validation Details

### Confirmed Webflow Signatures (from real zip inspection)
Direct inspection of `moneystack-website.webflow.zip` confirms:

| Signature | Location | Detection Method |
|-----------|----------|-----------------|
| `data-wf-site="..."` | `index.html` | `grep -m1 'data-wf-site'` or regex on first 2KB of index.html |
| `data-wf-page="..."` | Every page HTML | Present on all pages |
| `webflow.js` | `js/` directory | Check entries from unzip manifest |
| CSS directory | `css/` | Required by locked decisions |
| At least one `.html` file | Root | Required by locked decisions |

### Validation Steps (in order)
1. **index.html exists** — check unzip manifest entries for `index.html` at root level
2. **css/ directory exists** — check for any entry starting with `css/`
3. **webflow.js exists** — check for `js/webflow.js` OR `js/{site-name}.js` (Webflow uses site name as filename)
4. **data-wf-site attribute** — after extraction, `grep -m1 'data-wf-site' '${extractDir}/index.html'`

Error messages (from locked decisions):
- No HTML files: `"No HTML files found — is this a Webflow export?"`
- No CSS dir: `"Missing CSS directory — is this a Webflow export?"`
- No `data-wf-site`: `"No data-wf-site attribute found — this may not be a Webflow export"`

### Validating Before vs After Extraction
Steps 1-3 can run against the `unzip -l` manifest (before extraction) — this allows early rejection without extracting a multi-MB zip. Step 4 requires post-extraction file reading.

**Recommended flow:**
1. Run `unzip -l` → parse manifest → validate signatures 1-3 from manifest → show file count
2. Extract → validate step 4 (data-wf-site) → proceed to done

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Native file picker | Custom HTML file input with path access tricks | `osascript choose file` via shell.exec | WKWebView does not expose filesystem paths from file inputs — period |
| Zip extraction | Custom zip parser | `unzip` (system tool) | Battle-tested, handles all zip variants, available on all macOS systems |
| File content reading | Custom stream reader | `shell.exec('bash', ['-c', "base64 < '${path}'"]) ` then `atob()` | Handles encoding edge cases; pattern proven in Figma plugin |
| File count verification | Trust exit_code | `find` + `wc -l` post-extraction | unzip can partially succeed with exit_code 0 |

---

## Common Pitfalls

### Pitfall 1: Assuming `<input type="file">` Exposes a Path
**What goes wrong:** Developer uses `<input type="file">`, gets a `File` object, checks `file.path` — it's `undefined`. Falls back to `file.name` (just the filename, no directory), tries to pass that to `shell.exec('unzip', ...)` — fails because the path is incomplete.
**Why it happens:** Electron adds a custom `path` property to `File` objects; developers assume Tauri does the same. It does not.
**How to avoid:** Use `osascript choose file` — it's the only reliable way to get a full path.
**Warning signs:** Any code referencing `file.path`, `file.webkitRelativePath`, or trying to reconstruct a path from `file.name`.

### Pitfall 2: Silent Partial Extraction
**What goes wrong:** unzip exits 0 but extracted only 50 of 66 files (Unicode filename in an image caused a silent skip). Plugin shows "Done" but assets are missing from the extracted directory.
**Why it happens:** `unzip` returns exit code 0 when most files succeed; individual file failures go to stderr which is typically ignored.
**How to avoid:** Always compare `find . -type f | wc -l` (actual) vs count from `unzip -l` (expected). Surface any discrepancy.
**Warning signs:** `if (result.exit_code !== 0) throw` with no follow-up file count check.

### Pitfall 3: Validation Against Wrong File
**What goes wrong:** Plugin checks for `data-wf-site` in a CSS or JS file instead of HTML, or checks a `detail_*.html` CMS template which may have different attributes.
**Why it happens:** Iterating over all files and checking for the attribute anywhere.
**How to avoid:** Check `data-wf-site` specifically in `index.html` — that's where it lives in every Webflow export. The moneystack zip confirms: `data-wf-site` on the `<html>` tag of `index.html`.
**Warning signs:** `grep` running against the whole extracted directory rather than just `index.html`.

### Pitfall 4: osascript Cancellation Not Handled
**What goes wrong:** User opens the file picker and presses Escape/Cancel. `exit_code` is 1, `stderr` contains "User canceled. (-128)". Plugin surfaces this as an error: "File picker error: User canceled."
**Why it happens:** Error handling treats all non-zero exit codes as errors.
**How to avoid:** Check `result.stderr.includes('-128')` before reporting an error. Cancellation = silent no-op, return the user to idle state.
**Warning signs:** `if (result.exit_code !== 0) throw new Error(result.stderr)` without the -128 check.

### Pitfall 5: Shell Timeout on Large Zips
**What goes wrong:** A zip with several large video files (the moneystack zip has a 11MB .mov file) takes longer than the default 120s `shell.exec` timeout. User sees a timeout error during extraction, not a user-friendly message.
**Why it happens:** Default `shell.exec` timeout is 120 seconds. Extraction of video-heavy zips can exceed this.
**How to avoid:** Pass `{ timeout: 300000 }` (5 minutes) explicitly to the unzip `shell.exec` call.
**Warning signs:** `shell.exec('unzip', ...)` without an explicit timeout option.

---

## Code Examples

### Full osascript File Picker
```typescript
// Source: Apple Developer Docs + direct shell testing
export async function pickZipFile(shell: Shell): Promise<string | null> {
  const result = await shell.exec('osascript', [
    '-e',
    'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})'
  ]);

  if (result.exit_code !== 0) {
    if (result.stderr.includes('-128')) {
      return null; // User cancelled — treat as no-op
    }
    throw new Error(`File picker failed: ${result.stderr.trim()}`);
  }

  const path = result.stdout.trim();
  if (!path) throw new Error('No path returned from file picker');
  return path;
}
```

### mkdir + unzip + verify
```typescript
// Source: ARCHITECTURE.md + PITFALLS.md patterns
export async function extractAndVerify(
  shell: Shell,
  zipPath: string,
  extractDir: string,
  onProgress?: (step: string) => void
): Promise<{ fileCount: number; entries: string[] }> {
  // 1. Get manifest (fast — no extraction)
  const listResult = await shell.exec('unzip', ['-l', zipPath]);
  if (listResult.exit_code !== 0) {
    throw new Error(`Cannot read zip manifest: ${listResult.stderr.trim()}`);
  }
  const manifest = parseUnzipManifest(listResult.stdout);

  // 2. Create destination
  await shell.exec('mkdir', ['-p', extractDir]);

  // 3. Extract
  onProgress?.(`Extracting zip... (${manifest.fileCount} files)`);
  const extractResult = await shell.exec(
    'unzip', ['-o', zipPath, '-d', extractDir],
    { timeout: 300000 }
  );
  if (extractResult.exit_code !== 0) {
    throw new Error(`Extraction failed: ${extractResult.stderr.trim()}`);
  }

  // 4. Verify count
  const countResult = await shell.exec('bash', [
    '-c', `find '${extractDir}' -type f | wc -l | tr -d ' '`
  ]);
  const actual = parseInt(countResult.stdout.trim(), 10);
  const expected = manifest.fileCount;
  if (actual < expected - 2) { // 2-file tolerance
    throw new Error(
      `Extraction incomplete: expected ~${expected} files, found ${actual}. The zip may be corrupted.`
    );
  }

  return manifest;
}
```

### Webflow Validation
```typescript
// Source: Direct inspection of moneystack-website.webflow.zip
export async function validateWebflowExport(
  shell: Shell,
  extractDir: string,
  entries: string[]
): Promise<void> {
  // Check manifest entries (pre-extraction checks already done for css/, html)
  const hasHtml = entries.some(e => e.endsWith('.html') && !e.includes('/'));
  const hasCss = entries.some(e => e.startsWith('css/'));
  const hasWebflowJs = entries.some(e =>
    e.startsWith('js/') && e.endsWith('.js')
  );

  if (!hasHtml) {
    throw new Error('No HTML files found — is this a Webflow export?');
  }
  if (!hasCss) {
    throw new Error('Missing CSS directory — is this a Webflow export?');
  }

  // Check data-wf-site in index.html (requires post-extraction read)
  const grepResult = await shell.exec('bash', [
    '-c', `grep -c 'data-wf-site' '${extractDir}/index.html' 2>/dev/null || echo 0`
  ]);
  const wfSiteCount = parseInt(grepResult.stdout.trim(), 10);
  if (wfSiteCount === 0) {
    throw new Error('No data-wf-site attribute found — this may not be a Webflow export');
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `<input type="file">` for Tauri file path | `osascript choose file` via shell.exec | WKWebView does not expose paths; confirmed in wry issue #87 |
| Trust exit_code from unzip | exit_code + file count verification | Silent partial extraction is a documented real-world failure mode |
| Single validation check (index.html exists) | Layered: HTML + CSS dir + webflow.js + data-wf-site attribute | Webflow-specific signatures needed to distinguish from generic zip |

---

## Open Questions

1. **osascript on non-macOS platforms**
   - What we know: Ship Studio appears to be macOS-only based on all plugin source inspection, plugin conventions, and `pbcopy` usage in the Figma plugin
   - What's unclear: Whether Ship Studio runs on Linux/Windows (would break osascript)
   - Recommendation: Implement with macOS assumption; add a guard that surfaces a clear error if osascript is unavailable (check exit_code + stderr for "command not found")

2. **osascript sandboxing in Ship Studio's Tauri context**
   - What we know: `osascript` runs successfully from the shell in the test environment. `shell.exec` runs commands as the current user.
   - What's unclear: Whether Ship Studio's Tauri process has any sandbox restrictions that would block `osascript` from showing a file picker UI
   - Recommendation: This is LOW risk — Tauri does not sandbox shell.exec execution. The `osascript` call goes through the system shell, which can interact with the UI layer. If it fails in practice, fall back to a text input where the user pastes the path (UI already shows the file path after selection anyway).

3. **Webflow zips with non-standard structures**
   - What we know: Moneystack zip has root-level HTML + css/ + js/ + images/ + videos/ + legal/ directories
   - What's unclear: Whether all Webflow exports have the same root structure or if older exports use different layouts
   - Recommendation: Validation should be permissive on optional directories (locked decision); only require at least one HTML file + css/ directory + data-wf-site. This aligns with locked decisions.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (from sibling plugin-brand-guidelines — same stack) |
| Config file | `vitest.config.ts` — does not exist yet (Wave 0 gap) |
| Quick run command | `npx vitest run src/zip/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ZIP-01 | osascript returns path or null on cancel | unit | `npx vitest run src/zip/extract.test.ts` | Wave 0 |
| ZIP-02 | unzip + count verify | unit | `npx vitest run src/zip/extract.test.ts` | Wave 0 |
| ZIP-03 | validation accepts real Webflow zip, rejects others | unit | `npx vitest run src/zip/discover.test.ts` | Wave 0 |
| ZIP-04 | progress step labels and file count display | manual | Open plugin in Ship Studio, select zip, observe modal | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/zip/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/zip/extract.test.ts` — covers ZIP-01 and ZIP-02 with mock shell
- [ ] `src/zip/discover.test.ts` — covers ZIP-03 manifest parsing and validation logic
- [ ] `vitest.config.ts` — minimal config (copy from plugin-brand-guidelines)
- [ ] Install: `npm install -D vitest` — not yet in package.json

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `plugin-starter/CLAUDE.md` — Ship Studio plugin API, available invoke commands, shell.exec spec
- Direct inspection: `plugin-webflow-to-code/src/types.ts`, `context.ts`, `views/MainView.tsx` — current implementation state
- Direct inspection: `plugin-figma/src/brief/io.ts` — base64 shell pattern, shell.exec usage
- Direct inspection: `moneystack-website.webflow.zip` — confirmed Webflow export structure, `data-wf-site` location, file counts
- Direct testing: `osascript` available and functional in shell environment
- wry issue #87 (tauri-apps/wry) — confirmed `<input type="file">` does NOT expose path in Tauri WebView

### Secondary (MEDIUM confidence)
- wry issue #87 resolution: Tauri explicitly chose drag-and-drop over File.path (mirrors browser security model)
- Tauri/tauri discussion #11102 — Tauri v2 dialog plugin is the "correct" approach but requires Tauri command registration unavailable in Ship Studio plugins

### Tertiary (LOW confidence)
- General WKWebView file input limitations — Apple Developer Forums confirm file input works but no path exposure

---

## Metadata

**Confidence breakdown:**
- File picker approach (osascript): HIGH — confirmed working in shell, documented Tauri limitation
- Extraction pattern: HIGH — proven in ARCHITECTURE.md, verified against real zip
- Validation signatures: HIGH — confirmed against actual Webflow export
- Test framework (vitest): HIGH — sibling plugin uses same setup

**Research date:** 2026-03-16
**Valid until:** 2026-06-16 (stable — osascript, unzip, Webflow export format all stable)
