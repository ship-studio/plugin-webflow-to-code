// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import type { MigrationPlan, PlanItem } from './types';
import { loadMigrationPlan, computeProgress, computePageProgress } from './read';

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

describe('computeProgress', () => {
  it('returns zero for empty plan', () => {
    const plan: MigrationPlan = { version: '1.0', generatedAt: '2026-03-18', items: [] };
    expect(computeProgress(plan)).toEqual({ complete: 0, total: 0 });
  });

  it('counts children as leaves, not the page', () => {
    const plan: MigrationPlan = {
      version: '1.0',
      generatedAt: '2026-03-18',
      items: [
        {
          name: 'Home',
          type: 'page',
          status: 'pending',
          children: [
            { name: 'Hero', type: 'section', status: 'complete' },
            { name: 'Features', type: 'section', status: 'complete' },
            { name: 'Footer', type: 'section', status: 'pending' },
          ],
        },
      ],
    };
    expect(computeProgress(plan)).toEqual({ complete: 2, total: 3 });
  });

  it('counts shared items as leaves alongside page children', () => {
    const plan: MigrationPlan = {
      version: '1.0',
      generatedAt: '2026-03-18',
      items: [
        { name: 'Nav', type: 'shared', status: 'complete' },
        { name: 'Footer', type: 'shared', status: 'pending' },
        {
          name: 'Home',
          type: 'page',
          status: 'pending',
          children: [
            { name: 'Hero', type: 'section', status: 'complete' },
            { name: 'Features', type: 'section', status: 'complete' },
          ],
        },
      ],
    };
    expect(computeProgress(plan)).toEqual({ complete: 3, total: 4 });
  });

  it('counts childless page as a leaf', () => {
    const plan: MigrationPlan = {
      version: '1.0',
      generatedAt: '2026-03-18',
      items: [{ name: 'About', type: 'page', status: 'complete' }],
    };
    expect(computeProgress(plan)).toEqual({ complete: 1, total: 1 });
  });

  it('handles in-progress status as not complete', () => {
    const plan: MigrationPlan = {
      version: '1.0',
      generatedAt: '2026-03-18',
      items: [{ name: 'Nav', type: 'shared', status: 'in-progress' }],
    };
    expect(computeProgress(plan)).toEqual({ complete: 0, total: 1 });
  });
});

describe('computePageProgress', () => {
  it('returns fraction for page with children', () => {
    const page: PlanItem = {
      name: 'Home',
      type: 'page',
      status: 'pending',
      children: [
        { name: 'Hero', type: 'section', status: 'complete' },
        { name: 'Features', type: 'section', status: 'complete' },
        { name: 'Footer', type: 'section', status: 'pending' },
      ],
    };
    expect(computePageProgress(page)).toEqual({ complete: 2, total: 3 });
  });

  it('returns 0/1 for childless pending page', () => {
    const page: PlanItem = { name: 'About', type: 'page', status: 'pending' };
    expect(computePageProgress(page)).toEqual({ complete: 0, total: 1 });
  });

  it('returns 1/1 for childless complete page', () => {
    const page: PlanItem = { name: 'About', type: 'page', status: 'complete' };
    expect(computePageProgress(page)).toEqual({ complete: 1, total: 1 });
  });
});
