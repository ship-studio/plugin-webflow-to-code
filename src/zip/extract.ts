import type { Shell } from '../types';
import type { ZipManifest } from './types';
import { parseUnzipManifest } from './discover';
import { IS_WINDOWS, quoteForPowerShell, makeDir, countFiles } from '../platform';

/** Seconds the native file dialog may stay open — user think-time, not I/O. */
const PICKER_TIMEOUT = 300;
/** Seconds for listing zip entries (local disk read). */
const LIST_TIMEOUT = 30;
/** Seconds for the extraction itself (large exports with videos). */
const EXTRACT_TIMEOUT = 300;

/**
 * Opens a native file picker and returns the selected zip path.
 * macOS: AppleScript `choose file` via osascript.
 * Windows: System.Windows.Forms.OpenFileDialog via PowerShell (-STA is
 * required for the WinForms dialog; cancel leaves stdout empty).
 * Returns null if the user cancels. Throws on errors.
 */
export async function pickZipFile(
  shell: Shell,
  isWindows: boolean = IS_WINDOWS,
): Promise<string | null> {
  if (isWindows) {
    const psScript =
      'Add-Type -AssemblyName System.Windows.Forms; ' +
      '$f = New-Object System.Windows.Forms.OpenFileDialog; ' +
      "$f.Filter = 'Zip archives (*.zip)|*.zip'; " +
      "$f.Title = 'Select Webflow export zip'; " +
      "if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($f.FileName) }";
    const result = await shell.exec(
      'powershell',
      ['-NoProfile', '-STA', '-Command', psScript],
      { timeout: PICKER_TIMEOUT },
    );
    if (result.exit_code !== 0) {
      throw new Error(`File picker failed: ${result.stderr.trim()}`);
    }
    const winPath = result.stdout.trim();
    return winPath || null; // empty stdout = user cancelled
  }

  const result = await shell.exec(
    'osascript',
    [
      '-e',
      'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})',
    ],
    { timeout: PICKER_TIMEOUT },
  );

  if (result.exit_code !== 0) {
    if (result.stderr.includes('-128')) {
      return null; // User cancelled
    }
    throw new Error(`File picker failed: ${result.stderr.trim()}`);
  }

  const path = result.stdout.trim();
  if (!path) {
    throw new Error('No path returned from file picker');
  }
  return path;
}

/**
 * Builds a sanitized temp directory path for zip extraction.
 * Strips .zip extension, replaces non-alphanumeric chars, truncates to 60 chars.
 */
export function buildExtractDir(projectPath: string, zipPath: string): string {
  const zipFileName = zipPath.split(/[\\/]/).pop()!;
  const sanitizedName = zipFileName
    .replace(/\.zip$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 60);
  return `${projectPath}/.shipstudio/tmp/${sanitizedName}`;
}

/**
 * Reads the zip's entry list without extracting.
 * macOS: `unzip -l` (bundled). Windows: System.IO.Compression via PowerShell.
 * Entries are normalized to forward slashes; directories keep a trailing `/`.
 */
async function readZipManifest(
  shell: Shell,
  zipPath: string,
  isWindows: boolean,
): Promise<ZipManifest> {
  if (isWindows) {
    const psScript =
      'Add-Type -AssemblyName System.IO.Compression.FileSystem; ' +
      `$z = [System.IO.Compression.ZipFile]::OpenRead(${quoteForPowerShell(zipPath)}); ` +
      'foreach ($e in $z.Entries) { [Console]::Out.WriteLine($e.FullName) }; ' +
      '$z.Dispose()';
    const listResult = await shell.exec(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-Command', psScript],
      { timeout: LIST_TIMEOUT },
    );
    if (listResult.exit_code !== 0) {
      throw new Error(`Cannot read zip manifest: ${listResult.stderr.trim()}`);
    }
    const entries = listResult.stdout
      .split(/\r?\n/)
      .map((line) => line.replace(/\\/g, '/').trim())
      .filter((line) => line.length > 0);
    const fileCount = entries.filter((e) => !e.endsWith('/')).length;
    return { fileCount, entries };
  }

  const listResult = await shell.exec('unzip', ['-l', zipPath], { timeout: LIST_TIMEOUT });
  if (listResult.exit_code !== 0) {
    throw new Error(`Cannot read zip manifest: ${listResult.stderr.trim()}`);
  }
  return parseUnzipManifest(listResult.stdout);
}

/**
 * Extracts a zip file with file count verification.
 * 1. Reads the entry manifest
 * 2. Creates the extract directory
 * 3. Extracts (5-minute timeout)
 * 4. Verifies file count (2-file tolerance)
 */
export async function extractAndVerify(
  shell: Shell,
  zipPath: string,
  extractDir: string,
  onProgress?: (label: string) => void,
  isWindows: boolean = IS_WINDOWS,
): Promise<ZipManifest> {
  // 1. Get manifest
  const manifest = await readZipManifest(shell, zipPath, isWindows);

  // 2. Create destination
  await makeDir(shell, extractDir);

  // 3. Extract with 5-minute timeout.
  // macOS: `ditto` instead of `unzip` — the bundled unzip (Info-ZIP 6.00)
  // doesn't decode UTF-8 filenames, so accented characters get mangled into
  // byte sequences the filesystem rejects.
  // Windows: PowerShell's Expand-Archive.
  onProgress?.(`Extracting zip... (${manifest.fileCount} files)`);
  const extractResult = isWindows
    ? await shell.exec(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Expand-Archive -LiteralPath ${quoteForPowerShell(zipPath)} -DestinationPath ${quoteForPowerShell(extractDir)} -Force`,
        ],
        { timeout: EXTRACT_TIMEOUT },
      )
    : await shell.exec('ditto', ['-x', '-k', zipPath, extractDir], {
        timeout: EXTRACT_TIMEOUT,
      });
  if (extractResult.exit_code !== 0) {
    throw new Error(`Extraction failed: ${extractResult.stderr.trim()}`);
  }

  // 4. Verify file count
  const actual = await countFiles(shell, extractDir);
  if (actual < manifest.fileCount - 2) {
    throw new Error(
      `Extraction incomplete: expected ~${manifest.fileCount} files, found ${actual}. The zip may be corrupted.`,
    );
  }

  return manifest;
}
