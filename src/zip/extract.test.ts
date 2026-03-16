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

describe('pickZipFile', () => {
  it('returns trimmed absolute path when shell.exec returns exit_code 0', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '/Users/foo/site.zip\n', stderr: '' },
    ]);
    const result = await pickZipFile(shell);
    expect(result).toBe('/Users/foo/site.zip');
    expect(shell.exec).toHaveBeenCalledWith('osascript', [
      '-e',
      'POSIX path of (choose file with prompt "Select Webflow export zip" of type {"zip"})',
    ]);
  });

  it('returns null when user cancels (exit code 1 with -128 in stderr)', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'User canceled. (-128)' },
    ]);
    const result = await pickZipFile(shell);
    expect(result).toBeNull();
  });

  it('throws Error with stderr message when exit_code 1 and stderr does NOT contain -128', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'Some osascript error' },
    ]);
    await expect(pickZipFile(shell)).rejects.toThrow('Some osascript error');
  });

  it('throws Error when exit_code 0 but stdout is empty', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '', stderr: '' },
    ]);
    await expect(pickZipFile(shell)).rejects.toThrow('No path returned');
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
});

describe('extractAndVerify', () => {
  const SAMPLE_UNZIP_LIST = `  Length      Date    Time    Name
---------  ---------- -----   ----
        0  02-04-2026 22:37   css/
     7772  02-04-2026 22:37   css/normalize.css
    15234  02-04-2026 22:37   css/moneystack-website.css
    45678  02-04-2026 22:37   index.html
---------                     -------
 35767120                     4 files
`;

  it('calls unzip -l, mkdir -p, unzip -o with 300000 timeout, then find in order', async () => {
    const shell = createMockShell([
      // unzip -l
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      // mkdir -p
      { exit_code: 0, stdout: '', stderr: '' },
      // unzip -o
      { exit_code: 0, stdout: '', stderr: '' },
      // find count
      { exit_code: 0, stdout: '4', stderr: '' },
    ]);

    await extractAndVerify(shell, '/path/site.zip', '/tmp/out');

    expect(shell.exec).toHaveBeenCalledTimes(4);
    expect(shell.exec).toHaveBeenNthCalledWith(1, 'unzip', ['-l', '/path/site.zip']);
    expect(shell.exec).toHaveBeenNthCalledWith(2, 'mkdir', ['-p', '/tmp/out']);
    expect(shell.exec).toHaveBeenNthCalledWith(3, 'unzip', ['-o', '/path/site.zip', '-d', '/tmp/out'], { timeout: 300000 });
    expect(shell.exec).toHaveBeenNthCalledWith(4, 'bash', ['-c', expect.stringContaining('find')]);
  });

  it('throws when unzip -l returns non-zero exit code', async () => {
    const shell = createMockShell([
      { exit_code: 1, stdout: '', stderr: 'cannot find zip' },
    ]);
    await expect(extractAndVerify(shell, '/path/bad.zip', '/tmp/out')).rejects.toThrow('Cannot read zip');
  });

  it('throws "Extraction incomplete" when actual file count is more than 2 less than expected', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '1', stderr: '' }, // 1 actual vs 4 expected
    ]);
    await expect(extractAndVerify(shell, '/path/site.zip', '/tmp/out')).rejects.toThrow('Extraction incomplete');
  });

  it('succeeds when actual count is within 2-file tolerance of expected', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '3', stderr: '' }, // 3 actual vs 4 expected, within tolerance
    ]);
    const result = await extractAndVerify(shell, '/path/site.zip', '/tmp/out');
    expect(result).toHaveProperty('fileCount');
    expect(result).toHaveProperty('entries');
  });

  it('calls onProgress callback with "Extracting zip..." message', async () => {
    const onProgress = vi.fn();
    const shell = createMockShell([
      { exit_code: 0, stdout: SAMPLE_UNZIP_LIST, stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '', stderr: '' },
      { exit_code: 0, stdout: '4', stderr: '' },
    ]);
    await extractAndVerify(shell, '/path/site.zip', '/tmp/out', onProgress);
    expect(onProgress).toHaveBeenCalledWith('Extracting zip... (4 files)');
  });
});
