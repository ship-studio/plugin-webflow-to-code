import type { Shell } from '../types';
import type { ZipManifest } from './types';

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

  // Extract total from summary: "  35767120                     66 files"
  const summaryMatch = stdout.match(/(\d+) files/);
  const fileCount = summaryMatch ? parseInt(summaryMatch[1], 10) : entries.length;

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

  const grepResult = await shell.exec('bash', [
    '-c',
    `grep -c 'data-wf-site' '${extractDir}/index.html' 2>/dev/null || echo 0`,
  ]);
  const wfSiteCount = parseInt(grepResult.stdout.trim(), 10);
  if (wfSiteCount === 0) {
    throw new Error(
      'No data-wf-site attribute found — this may not be a Webflow export',
    );
  }
}
