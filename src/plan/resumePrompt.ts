/**
 * Builds a resume prompt for an agent to continue a migration from where it left off.
 * Pure function — no async, no side effects.
 */
export function buildResumePrompt(projectPath: string): string {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  return (
    `Read the migration plan at ${planPath} and the brief at ${briefPath}. ` +
    `Continue the migration from where you left off — update each item's status in the plan file as you complete it.`
  );
}
