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
  it('calls shell.exec with bash as first arg', async () => {
    const shell = makeMockShell();
    await saveBrief(shell, '/tmp/project', 'Hello brief');
    expect(shell.exec).toHaveBeenCalledWith('bash', expect.any(Array));
  });

  it('command string contains base64 -d', async () => {
    const shell = makeMockShell();
    await saveBrief(shell, '/tmp/project', 'Hello brief');
    const args = shell.exec.mock.calls[0][1] as string[];
    const cmd = args[1]; // args is ['-c', '<command>']
    expect(cmd).toContain('base64 -d');
  });

  it('command string contains correct brief path', async () => {
    const shell = makeMockShell();
    await saveBrief(shell, '/tmp/project', 'Hello brief');
    const args = shell.exec.mock.calls[0][1] as string[];
    const cmd = args[1];
    expect(cmd).toContain('/tmp/project/.shipstudio/assets/brief.md');
  });

  it('encodes content with btoa(unescape(encodeURIComponent(...)))', async () => {
    const shell = makeMockShell();
    const markdown = 'Hello brief with special chars: <>&|';
    await saveBrief(shell, '/tmp/project', markdown);
    const args = shell.exec.mock.calls[0][1] as string[];
    const cmd = args[1];
    const expectedEncoded = btoa(unescape(encodeURIComponent(markdown)));
    expect(cmd).toContain(expectedEncoded);
  });

  it('throws on non-zero exit code with "Failed to save brief" message', async () => {
    const shell = makeMockShell(1, 'disk full');
    await expect(saveBrief(shell, '/tmp/project', 'Hello brief')).rejects.toThrow(
      'Failed to save brief',
    );
  });
});

describe('copyToClipboard', () => {
  it('calls shell.exec with bash as first arg', async () => {
    const shell = makeMockShell();
    await copyToClipboard(shell, 'Hello brief');
    expect(shell.exec).toHaveBeenCalledWith('bash', expect.any(Array));
  });

  it('command string contains pbcopy', async () => {
    const shell = makeMockShell();
    await copyToClipboard(shell, 'Hello brief');
    const args = shell.exec.mock.calls[0][1] as string[];
    const cmd = args[1];
    expect(cmd).toContain('pbcopy');
  });

  it('command string contains base64 -d', async () => {
    const shell = makeMockShell();
    await copyToClipboard(shell, 'Hello brief');
    const args = shell.exec.mock.calls[0][1] as string[];
    const cmd = args[1];
    expect(cmd).toContain('base64 -d');
  });

  it('throws on non-zero exit code with "Clipboard copy failed" message', async () => {
    const shell = makeMockShell(1, 'pbcopy not found');
    await expect(copyToClipboard(shell, 'Hello brief')).rejects.toThrow(
      'Clipboard copy failed',
    );
  });
});
