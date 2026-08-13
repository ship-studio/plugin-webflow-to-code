// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import type { MigrationPlan } from './types';
import { saveMigrationPlan } from './io';

function makeMockShell(exitCode = 0, stderr = '') {
  return {
    exec: vi.fn().mockResolvedValue({
      exit_code: exitCode,
      stdout: '',
      stderr,
    }),
  };
}

const mockPlan: MigrationPlan = {
  version: '1.0' as const,
  generatedAt: '2026-03-18',
  items: [{ name: 'Shared Nav', type: 'shared' as const, status: 'pending' as const }],
};

describe('saveMigrationPlan', () => {
  it('writes via a node one-liner (cross-platform), not bash', async () => {
    const shell = makeMockShell();
    await saveMigrationPlan(shell, '/tmp/project', mockPlan);
    expect(shell.exec).toHaveBeenCalledWith('node', expect.any(Array), expect.any(Object));
  });

  it('passes the plan path via argv, with parent-dir creation in the script', async () => {
    const shell = makeMockShell();
    await saveMigrationPlan(shell, '/tmp/project', mockPlan);
    const args = shell.exec.mock.calls[0][1] as string[];
    expect(args).toContain('/tmp/project/.shipstudio/migration-plan.json');
    expect(args.join(' ')).toContain('mkdirSync');
  });

  it('passes the base64-encoded plan via argv', async () => {
    const shell = makeMockShell();
    await saveMigrationPlan(shell, '/tmp/project', mockPlan);
    const args = shell.exec.mock.calls[0][1] as string[];
    const json = JSON.stringify(mockPlan, null, 2);
    const expectedEncoded = btoa(unescape(encodeURIComponent(json)));
    expect(args).toContain(expectedEncoded);
  });

  it('throws on non-zero exit code with message containing Failed to save migration plan', async () => {
    const shell = makeMockShell(1, 'disk full');
    await expect(saveMigrationPlan(shell, '/tmp/project', mockPlan)).rejects.toThrow(
      'Failed to save migration plan',
    );
  });
});
