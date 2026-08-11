import type { MigrationPlan, PlanItem } from './types';
import type { Shell } from '../types';
import { readFileBase64, decodeBase64 } from '../platform';

export async function loadMigrationPlan(
  shell: Shell,
  projectPath: string,
): Promise<MigrationPlan | null> {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  // Node read instead of `bash -c "cat | base64"` — cross-platform
  // (ship-studio/ship-studio#659).
  const result = await readFileBase64(shell, planPath);
  if (result.exit_code !== 0) return null;
  try {
    const json = decodeBase64(result.stdout.trim());
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
