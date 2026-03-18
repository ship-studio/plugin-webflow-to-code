import type { MigrationPlan, PlanItem } from './types';

interface ShellLike {
  exec(cmd: string, args: string[]): Promise<{ exit_code: number; stdout: string; stderr: string }>;
}

export async function loadMigrationPlan(
  shell: ShellLike,
  projectPath: string,
): Promise<MigrationPlan | null> {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const result = await shell.exec('bash', ['-c', `cat '${planPath}' | base64`]);
  if (result.exit_code !== 0) return null;
  try {
    const json = decodeURIComponent(escape(atob(result.stdout.trim())));
    return JSON.parse(json) as MigrationPlan;
  } catch {
    return null;
  }
}

export function computeProgress(plan: MigrationPlan): { complete: number; total: number } {
  let complete = 0;
  let total = 0;
  for (const item of plan.items) {
    const leaves = item.children && item.children.length > 0 ? item.children : [item];
    for (const leaf of leaves) {
      total++;
      if (leaf.status === 'complete') complete++;
    }
  }
  return { complete, total };
}

export function computePageProgress(item: PlanItem): { complete: number; total: number } {
  if (!item.children || item.children.length === 0) {
    return { complete: item.status === 'complete' ? 1 : 0, total: 1 };
  }
  let complete = 0;
  for (const child of item.children) {
    if (child.status === 'complete') complete++;
  }
  return { complete, total: item.children.length };
}
