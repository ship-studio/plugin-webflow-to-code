import type { Shell } from '../types';
import type { ZipManifest } from './types';
import { parseUnzipManifest } from './discover';

/**
 * Opens a native macOS file picker via osascript and returns the selected zip path.
 * Returns null if the user cancels. Throws on errors.
 */
export async function pickZipFile(shell: Shell): Promise<string | null> {
  const result = await shell.exec('osascript', [
    '-e',
    'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})',
  ]);

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
  const zipFileName = zipPath.split('/').pop()!;
  const sanitizedName = zipFileName
    .replace(/\.zip$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 60);
  return `${projectPath}/.shipstudio/tmp/${sanitizedName}`;
}

/**
 * Extracts a zip file with file count verification.
 * 1. Reads manifest via unzip -l
 * 2. Creates extract directory
 * 3. Extracts with 5-minute timeout
 * 4. Verifies file count (2-file tolerance)
 */
export async function extractAndVerify(
  shell: Shell,
  zipPath: string,
  extractDir: string,
  onProgress?: (label: string) => void,
): Promise<ZipManifest> {
  // 1. Get manifest
  const listResult = await shell.exec('unzip', ['-l', zipPath]);
  if (listResult.exit_code !== 0) {
    throw new Error(`Cannot read zip manifest: ${listResult.stderr.trim()}`);
  }
  const manifest = parseUnzipManifest(listResult.stdout);

  // 2. Create destination
  await shell.exec('mkdir', ['-p', extractDir]);

  // 3. Extract with 5-minute timeout
  onProgress?.(`Extracting zip... (${manifest.fileCount} files)`);
  const extractResult = await shell.exec(
    'unzip',
    ['-o', zipPath, '-d', extractDir],
    { timeout: 300000 },
  );
  if (extractResult.exit_code !== 0) {
    throw new Error(`Extraction failed: ${extractResult.stderr.trim()}`);
  }

  // 4. Verify file count
  const countResult = await shell.exec('bash', [
    '-c',
    `find '${extractDir}' -type f | wc -l | tr -d ' '`,
  ]);
  const actual = parseInt(countResult.stdout.trim(), 10);
  if (actual < manifest.fileCount - 2) {
    throw new Error(
      `Extraction incomplete: expected ~${manifest.fileCount} files, found ${actual}. The zip may be corrupted.`,
    );
  }

  return manifest;
}
