import type { MigrationPlan } from './types';
import type { Shell } from '../types';
import { encodeBase64, writeBase64File } from '../platform';

export async function saveMigrationPlan(
  shell: Shell,
  projectPath: string,
  plan: MigrationPlan,
): Promise<void> {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const json = JSON.stringify(plan, null, 2);
  // Chunked Node write (creates .shipstudio/) instead of the previous
  // `bash -c "mkdir -p && echo <b64> | base64 -d > file"`, which was
  // macOS/Linux-only (ship-studio/ship-studio#659) and rode the whole
  // payload on a single command line.
  try {
    await writeBase64File(shell, encodeBase64(json), planPath);
  } catch (err) {
    throw new Error(
      `Failed to save migration plan: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
