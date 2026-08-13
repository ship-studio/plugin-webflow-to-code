import { describe, it, expect, vi } from 'vitest';
import type { Shell } from '../types';
import { pickZipFile, extractAndVerify, buildExtractDir } from './extract';

function createMockShell(responses: Array<{ exit_code: number; stdout: string; stderr: string }>): Shell {
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

describe('pickZipFile (macOS)', () => {
  it('returns trimmed absolute path when shell.exec returns exit_code 0', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '/Users/foo/site.zip\n', stderr: '' },
    ]);
    const result = await pickZipFile(shell, false);
    expect(result).toBe('/Users/foo/site.zip');
    expect(shell.exec).toHaveBeenCalledWith(
      'osascript',
      [
        '-e',
        'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})',
      ],
      { timeout: 300 },
    );
  });

  it('returns null when user cancels (exit code 1 with -128 in stderr)', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'User canceled. (-128)' },
    ]);
    const result = await pickZipFile(shell, false);
    expect(result).toBeNull();
  });

  it('throws Error with stderr message when exit_code 1 and stderr does NOT contain -128', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'Some osascript error' },
    ]);
    await expect(pickZipFile(shell, false)).rejects.toThrow('Some osascript error');
  });

  it('throws Error when exit_code 0 but stdout is empty', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '', stderr: '' },
    ]);
    await expect(pickZipFile(shell, false)).rejects.toThrow('No path returned');
  });
});

describe('pickZipFile (Windows)', () => {
  it('invokes the PowerShell OpenFileDialog with -STA and a 300s timeout', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: 'C:\\Users\\foo\\site.zip', stderr: '' },
    ]);
    const result = await pickZipFile(shell, true);
    expect(result).toBe('C:\\Users\\foo\\site.zip');
    const call = (shell.exec as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('powershell');
    expect(call[1]).toContain('-STA');
    expect(call[1]).toContain('-NoProfile');
    expect(call[1].join(' ')).toContain('System.Windows.Forms.OpenFileDialog');
    expect(call[2]).toEqual({ timeout: 300 });
  });

  it('returns null when the dialog is cancelled (empty stdout, exit 0)', async () => {
    const shell = createMockShell([{ exit_code: 0, stdout: '', stderr: '' }]);
    const result = await pickZipFile(shell, true);
    expect(result).toBeNull();
  });

  it('throws when PowerShell exits non-zero', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'dialog blew up' },
    ]);
    await expect(pickZipFile(shell, true)).rejects.toThrow('dialog blew up');
  });
});

describe('buildExtractDir', () => {
  it('produces sanitized path stripping .zip extension and non-alphanumeric chars', () => {
    const result = buildExtractDir('/Users/foo/project', '/Users/foo/Downloads/my site (v2).zip');
    expect(result).toBe('/Users/foo/project/.shipstudio/tmp/my-site--v2-');
  });

  it('truncates long names to 60 characters', () => {
    const longName = 'a'.repeat(100) + '.zip';
    const result = buildExtractDir('/proj', `/path/${longName}`);
    expect(result).toBe(`/proj/.shipstudio/tmp/${'a'.repeat(60)}`);
  });

  it('handles case-insensitive .ZIP extension', () => {
    const result = buildExtractDir('/proj', '/path/export.ZIP');
    expect(result).toBe('/proj/.shipstudio/tmp/export');
  });

  it('handles Windows backslash paths', () => {
    const result = buildExtractDir('/proj', 'C:\\Users\\foo\\Downloads\\export.zip');
    expect(result).toBe('/proj/.shipstudio/tmp/export');
  });
});

describe('extractAndVerify (macOS)', () => {
  const SAMPLE_UNZIP_LIST = `  Length      Date    Time    Name
---------  ---------- -----   ----
        0  02-04-2026 22:37   css/
     7772  02-04-2026 22:37   css/normalize.css
    15234  02-04-2026 22:37   css/moneystack-website.css
    45678  02-04-2026 22:37   index.html
---------                     -------
 35767120                     4 files
`;

  it('calls unzip -l, node mkdir, ditto -x -k with a 300s timeout, then node count in order', async () => {
    const shell = createMockShell([
      // unzip -l
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      // node mkdir
      { exit_code: 0, stdout: '', stderr: '' },
      // ditto -x -k
      { exit_code: 0, stdout: '', stderr: '' },
      // node file count (3 files — css/ directory entry excluded from fileCount)
      { exit_code: 0, stdout: '3', stderr: '' },
    ]);

    await extractAndVerify(shell, '/path/site.zip', '/tmp/out', undefined, false);

    const calls = (shell.exec as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(4);
    expect(calls[0]).toEqual(['unzip', ['-l', '/path/site.zip'], { timeout: 30 }]);
    expect(calls[1][0]).toBe('node');
    expect(calls[1][1].join(' ')).toContain('mkdirSync');
    expect(calls[1][1]).toContain('/tmp/out');
    expect(calls[2]).toEqual(['ditto', ['-x', '-k', '/path/site.zip', '/tmp/out'], { timeout: 300 }]);
    expect(calls[3][0]).toBe('node');
    expect(calls[3][1].join(' ')).toContain('readdirSync');
  });

  it('throws when unzip -l returns non-zero exit code', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'cannot find zip' },
    ]);
    await expect(extractAndVerify(shell, '/path/bad.zip', '/tmp/out', undefined, false)).rejects.toThrow('Cannot read zip');
  });

  it('throws "Extraction incomplete" when actual file count is more than 2 less than expected', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '0', stderr: '' }, // 0 actual vs 3 expected (dir excluded)
    ]);
    await expect(extractAndVerify(shell, '/path/site.zip', '/tmp/out', undefined, false)).rejects.toThrow('Extraction incomplete');
  });

  it('succeeds when actual count is within 2-file tolerance of expected', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '2', stderr: '' }, // 2 actual vs 3 expected (dir excluded), within tolerance
    ]);
    const result = await extractAndVerify(shell, '/path/site.zip', '/tmp/out', undefined, false);
    expect(result).toHaveProperty('fileCount');
    expect(result).toHaveProperty('entries');
  });

  it('calls onProgress callback with "Extracting zip..." message', async () => {
    const onProgress = vi.fn();
    const shell = createMockShell([
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '3', stderr: '' },
    ]);
    await extractAndVerify(shell, '/path/site.zip', '/tmp/out', onProgress, false);
    expect(onProgress).toHaveBeenCalledWith('Extracting zip... (3 files)');
  });
});

describe('extractAndVerify (Windows)', () => {
  const PS_LIST = 'css/\r\ncss/normalize.css\r\ncss/moneystack-website.css\r\nindex.html\r\n';

  it('lists via PowerShell ZipFile, extracts via Expand-Archive, counts via node', async () => {
    const shell = createMockShell([
      // powershell entry listing
      { exit_code: 0, stdout: PS_LIST, stderr: '' },
      // node mkdir
      { exit_code: 0, stdout: '', stderr: '' },
      // powershell Expand-Archive
      { exit_code: 0, stdout: '', stderr: '' },
      // node file count
      { exit_code: 0, stdout: '3', stderr: '' },
    ]);

    const manifest = await extractAndVerify(shell, 'C:\\zips\\site.zip', '/proj/.shipstudio/tmp/site', undefined, true);

    expect(manifest.fileCount).toBe(3);
    expect(manifest.entries).toContain('index.html');
    expect(manifest.entries).toContain('css/');

    const calls = (shell.exec as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('powershell');
    expect(calls[0][1].join(' ')).toContain('ZipFile');
    expect(calls[0][2]).toEqual({ timeout: 30 });
    expect(calls[2][0]).toBe('powershell');
    expect(calls[2][1].join(' ')).toContain('Expand-Archive');
    expect(calls[2][1].join(' ')).toContain("'C:\\zips\\site.zip'");
    expect(calls[2][2]).toEqual({ timeout: 300 });
  });

  it('normalizes backslash entry names to forward slashes', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: 'css\\site.css\r\nindex.html\r\n', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '2', stderr: '' },
    ]);
    const manifest = await extractAndVerify(shell, 'C:\\site.zip', '/tmp/out', undefined, true);
    expect(manifest.entries).toContain('css/site.css');
  });

  it('throws when the PowerShell listing fails', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'not a zip' },
    ]);
    await expect(extractAndVerify(shell, 'C:\\bad.zip', '/tmp/out', undefined, true)).rejects.toThrow('Cannot read zip');
  });
});
