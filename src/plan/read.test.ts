// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import type { MigrationPlan } from './types';
import { loadMigrationPlan } from './read';

function encodePlan(plan: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(plan))));
}

function makeShell(exitCode: number, stdout: string, stderr = '') {
  return {
    exec: vi.fn().mockResolvedValue({ exit_code: exitCode, stdout, stderr }),
  };
}

const samplePlan: MigrationPlan = {
  version: '1.0' as const,
  generatedAt: '2026-03-18',
  items: [
    { name: 'Shared Nav', type: 'shared' as const, status: 'pending' as const },
    {
      name: 'Home',
      type: 'page' as const,
      status: 'pending' as const,
      children: [
        { name: 'Hero', type: 'section' as const, status: 'complete' as const },
        { name: 'Features', type: 'section' as const, status: 'pending' as const },
      ],
    },
  ],
};

describe('loadMigrationPlan', () => {
  it('returns null when shell exits non-zero (file missing)', async () => {
    const shell = makeShell(1, '', 'No such file or directory');
    const result = await loadMigrationPlan(shell, '/project');
    expect(result).toBeNull();
  });

  it('returns null on invalid JSON', async () => {
    const invalidEncoded = btoa(unescape(encodeURIComponent('not json')));
    const shell = makeShell(0, invalidEncoded + '\n');
    const result = await loadMigrationPlan(shell, '/project');
    expect(result).toBeNull();
  });

  it('returns parsed MigrationPlan on success', async () => {
    const encoded = encodePlan(samplePlan);
    const shell = makeShell(0, encoded + '\n');
    const result = await loadMigrationPlan(shell, '/project');
    expect(result).toEqual(samplePlan);
  });

  it('calls shell with correct command and path', async () => {
    const encoded = encodePlan(samplePlan);
    const shell = makeShell(0, encoded);
    await loadMigrationPlan(shell, '/project');
    expect(shell.exec).toHaveBeenCalledWith(
      'bash',
      ['-c', "cat '/project/.shipstudio/migration-plan.json' | base64"],
    );
  });
});
