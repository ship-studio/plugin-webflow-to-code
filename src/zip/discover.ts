import type { Shell } from '../types';
import type { ZipManifest } from './types';
import { readFileBase64, decodeBase64 } from '../platform';

/**
 * Parses `unzip -l` stdout to extract file count and entry list.
 * Uses regex column matching — NOT .split(' ') — to handle filenames with spaces.
 */
export function parseUnzipManifest(stdout: string): ZipManifest {
  const lines = stdout.split('\n');
  const entries: string[] = [];

  for (const line of lines) {
    // Skip header, separator, and summary lines
    if (line.match(/^-{5,}/) || line.match(/Length\s+Date/) || line.trim() === '') continue;
    // Filename is everything after the date/time columns
    const match = line.match(/^\s*\d+\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/);
    if (match) entries.push(match[1].trim());
  }

  // Count only actual files (exclude directory entries ending with /)
  const fileEntries = entries.filter((e) => !e.endsWith('/'));
  const fileCount = fileEntries.length;

  return { fileCount, entries };
}

/**
 * Validates that an extracted directory contains a Webflow export.
 * Checks: root HTML files, css/ directory, data-wf-site attribute in index.html.
 */
export async function validateWebflowExport(
  shell: Shell,
  extractDir: string,
  entries: string[],
): Promise<void> {
  const hasHtml = entries.some((e) => e.endsWith('.html') && !e.includes('/'));
  if (!hasHtml) {
    throw new Error('No HTML files found — is this a Webflow export?');
  }

  const hasCss = entries.some((e) => e.startsWith('css/'));
  if (!hasCss) {
    throw new Error('Missing CSS directory — is this a Webflow export?');
  }

  // Read index.html via Node and check in JS — cross-platform replacement
  // for the previous macOS-only `bash -c grep` (ship-studio/ship-studio#659).
  const readResult = await readFileBase64(shell, `${extractDir}/index.html`);
  const indexHtml = readResult.exit_code === 0 ? decodeBase64(readResult.stdout.trim()) : '';
  if (!indexHtml.includes('data-wf-site')) {
    throw new Error(
      'No data-wf-site attribute found — this may not be a Webflow export',
    );
  }
}
