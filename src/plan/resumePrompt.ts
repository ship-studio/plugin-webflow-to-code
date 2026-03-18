/**
 * Builds a resume prompt for an agent to continue a migration from where it left off.
 * Pure function — no async, no side effects.
 */
export function buildResumePrompt(_projectPath: string): string {
  return (
    `Read the migration plan at .shipstudio/migration-plan.json and the brief at .shipstudio/assets/brief.md. ` +
    `Continue the migration from where you left off. Check which items are still "pending" or "in-progress" in the plan file and pick up from there. ` +
    `Update each item's status in the plan file as you complete it.`
  );
}
