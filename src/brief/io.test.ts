// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { saveBrief, copyToClipboard } from './io';

function makeMockShell(exitCode = 0, stderr = '') {
  return {
    exec: vi.fn().mockResolvedValue({
      exit_code: exitCode,
      stdout: '',
      stderr,
    }),
  };
}

describe('saveBrief', () => {
  it('writes via a node one-liner (cross-platform), not bash', async () => {
    const shell = makeMockShell();
    await saveBrief(shell, '/tmp/project', 'Hello brief');
    expect(shell.exec).toHaveBeenCalledWith('node', expect.any(Array), expect.any(Object));
  });

  it('passes the brief path via argv', async () => {
    const shell = makeMockShell();
    await saveBrief(shell, '/tmp/project', 'Hello brief');
    const args = shell.exec.mock.calls[0][1] as string[];
    expect(args).toContain('/tmp/project/.shipstudio/assets/brief.md');
  });

  it('passes content base64-encoded via argv (UTF-8 safe)', async () => {
    const shell = makeMockShell();
    const markdown = 'Hello brief with special chars: <>&|';
    await saveBrief(shell, '/tmp/project', markdown);
    const args = shell.exec.mock.calls[0][1] as string[];
    const expectedEncoded = btoa(unescape(encodeURIComponent(markdown)));
    expect(args).toContain(expectedEncoded);
  });

  it('throws on non-zero exit code with "Failed to save brief" message', async () => {
    const shell = makeMockShell(1, 'disk full');
    await expect(saveBrief(shell, '/tmp/project', 'Hello brief')).rejects.toThrow(
      'Failed to save brief',
    );
  });
});

describe('copyToClipboard (macOS)', () => {
  it('pipes the payload into pbcopy via sh with the payload in argv', async () => {
    const shell = makeMockShell();
    await copyToClipboard(shell, 'Hello brief', false);
    const call = shell.exec.mock.calls[0];
    expect(call[0]).toBe('sh');
    const args = call[1] as string[];
    expect(args[1]).toContain('pbcopy');
    expect(args[1]).toContain('base64 -d');
    const expectedEncoded = btoa(unescape(encodeURIComponent('Hello brief')));
    expect(args).toContain(expectedEncoded);
  });

  it('throws on non-zero exit code with "Clipboard copy failed" message', async () => {
    const shell = makeMockShell(1, 'pbcopy not found');
    await expect(copyToClipboard(shell, 'Hello brief', false)).rejects.toThrow(
      'Clipboard copy failed',
    );
  });
});

describe('copyToClipboard (Windows)', () => {
  it('stages the payload via node, then decodes into the clipboard via PowerShell', async () => {
    const shell = {
      exec: vi
        .fn()
        // temp dir resolution
        .mockResolvedValueOnce({ exit_code: 0, stdout: 'C:\\Temp\\shipstudio-webflow-brief.b64', stderr: '' })
        // staged write
        .mockResolvedValueOnce({ exit_code: 0, stdout: '', stderr: '' })
        // Set-Clipboard
        .mockResolvedValueOnce({ exit_code: 0, stdout: '', stderr: '' }),
    };
    await copyToClipboard(shell, 'Hello brief', true);
    const calls = shell.exec.mock.calls;
    expect(calls[0][0]).toBe('node');
    expect(calls[1][0]).toBe('node');
    expect(calls[2][0]).toBe('powershell');
    expect(calls[2][1].join(' ')).toContain('Set-Clipboard');
    expect(calls[2][1].join(' ')).toContain("'C:\\Temp\\shipstudio-webflow-brief.b64'");
  });

  it('throws "Clipboard copy failed" when PowerShell exits non-zero', async () => {
    const shell = {
      exec: vi
        .fn()
        .mockResolvedValueOnce({ exit_code: 0, stdout: 'C:\\Temp\\b.b64', stderr: '' })
        .mockResolvedValueOnce({ exit_code: 0, stdout: '', stderr: '' })
        .mockResolvedValueOnce({ exit_code: 1, stdout: '', stderr: 'clipboard busy' }),
    };
    await expect(copyToClipboard(shell, 'Hello brief', true)).rejects.toThrow(
      'Clipboard copy failed',
    );
  });
});
