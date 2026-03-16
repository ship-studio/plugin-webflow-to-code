import { describe, it, expect, vi } from 'vitest';
import type { Shell } from '../types';
import { parseUnzipManifest, validateWebflowExport } from './discover';

const SAMPLE_UNZIP_OUTPUT = `  Length      Date    Time    Name
---------  ---------- -----   ----
        0  02-04-2026 22:37   css/
     7772  02-04-2026 22:37   css/normalize.css
    15234  02-04-2026 22:37   css/moneystack-website.css
     1024  02-04-2026 22:37   images/hero bg.png
    45678  02-04-2026 22:37   index.html
     9876  02-04-2026 22:37   about.html
      512  02-04-2026 22:37   js/webflow.js
---------                     -------
 35767120                     66 files
`;

function createMockShell(
  responses: Array<{ exit_code: number; stdout: string; stderr: string }>,
): Shell {
  let callIndex = 0;
  return {
    exec: vi.fn(async () => {
      const response = responses[callIndex];
      if (!response) throw new Error(`Unexpected shell.exec call #${callIndex}`);
      callIndex++;
      return response;
    }),
  };
}

describe('parseUnzipManifest', () => {
  it('extracts 66 files (from summary line) and correct entries from real unzip -l output', () => {
    const result = parseUnzipManifest(SAMPLE_UNZIP_OUTPUT);
    expect(result.fileCount).toBe(66);
    expect(result.entries).toHaveLength(7);
    expect(result.entries).toContain('css/normalize.css');
    expect(result.entries).toContain('index.html');
    expect(result.entries).toContain('js/webflow.js');
  });

  it('handles filenames with spaces (e.g., "images/hero bg.png")', () => {
    const result = parseUnzipManifest(SAMPLE_UNZIP_OUTPUT);
    expect(result.entries).toContain('images/hero bg.png');
  });

  it('handles directory entries (trailing /) — they appear in entries', () => {
    const result = parseUnzipManifest(SAMPLE_UNZIP_OUTPUT);
    expect(result.entries).toContain('css/');
  });

  it('returns entries array length as fileCount when summary line regex does not match', () => {
    const outputNoSummary = `  Length      Date    Time    Name
---------  ---------- -----   ----
     7772  02-04-2026 22:37   css/normalize.css
    45678  02-04-2026 22:37   index.html
---------                     -------
 53450                        total
`;
    const result = parseUnzipManifest(outputNoSummary);
    expect(result.fileCount).toBe(2);
    expect(result.entries).toEqual(['css/normalize.css', 'index.html']);
  });
});

describe('validateWebflowExport', () => {
  const validEntries = [
    'css/',
    'css/normalize.css',
    'css/moneystack-website.css',
    'images/hero bg.png',
    'index.html',
    'about.html',
    'js/webflow.js',
  ];

  it('passes for entries with root HTML, css/ dir, and index.html containing data-wf-site', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '2', stderr: '' }, // grep finds data-wf-site
    ]);
    await expect(
      validateWebflowExport(shell, '/tmp/out', validEntries),
    ).resolves.toBeUndefined();
  });

  it('throws "No HTML files found" when no .html entries at root', async () => {
    const entries = ['css/', 'css/normalize.css', 'sub/page.html'];
    const shell = createMockShell([]);
    await expect(
      validateWebflowExport(shell, '/tmp/out', entries),
    ).rejects.toThrow('No HTML files found — is this a Webflow export?');
  });

  it('throws "Missing CSS directory" when no css/ entries', async () => {
    const entries = ['index.html', 'about.html', 'js/webflow.js'];
    const shell = createMockShell([]);
    await expect(
      validateWebflowExport(shell, '/tmp/out', entries),
    ).rejects.toThrow('Missing CSS directory — is this a Webflow export?');
  });

  it('throws "No data-wf-site attribute found" when grep returns 0 matches', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '0', stderr: '' }, // grep finds nothing
    ]);
    await expect(
      validateWebflowExport(shell, '/tmp/out', validEntries),
    ).rejects.toThrow(
      'No data-wf-site attribute found — this may not be a Webflow export',
    );
  });
});
