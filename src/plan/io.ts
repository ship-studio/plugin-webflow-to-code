import type { MigrationPlan } from './types';

interface ShellLike {
  exec(cmd: string, args: string[]): Promise<{ exit_code: number; stdout: string; stderr: string }>;
}

export async function saveMigrationPlan(
  shell: ShellLike,
  projectPath: string,
  plan: MigrationPlan,
): Promise<void> {
  const planDir = `${projectPath}/.shipstudio`;
  const planPath = `${planDir}/migration-plan.json`;
  const json = JSON.stringify(plan, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const result = await shell.exec('bash', [
    '-c',
    `mkdir -p '${planDir}' && echo '${encoded}' | base64 -d > '${planPath}'`,
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save migration plan: ${result.stderr}`);
  }
}
