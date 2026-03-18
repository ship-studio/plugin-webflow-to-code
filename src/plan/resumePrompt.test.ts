import { describe, it, expect } from 'vitest';
import { buildResumePrompt } from './resumePrompt';

describe('buildResumePrompt', () => {
  it('includes the migration plan file path', () => {
    const result = buildResumePrompt('/Users/alice/my-project');
    expect(result).toContain('/Users/alice/my-project/.shipstudio/migration-plan.json');
  });

  it('includes the brief file path', () => {
    const result = buildResumePrompt('/Users/alice/my-project');
    expect(result).toContain('/Users/alice/my-project/.shipstudio/assets/brief.md');
  });

  it('instructs the agent to continue', () => {
    const result = buildResumePrompt('/Users/alice/my-project');
    expect(result.toLowerCase()).toMatch(/continue/);
  });

  it('uses the provided projectPath in both file paths', () => {
    const result = buildResumePrompt('/home/bob/site');
    expect(result).toContain('/home/bob/site/.shipstudio/migration-plan.json');
    expect(result).toContain('/home/bob/site/.shipstudio/assets/brief.md');
  });

  it('is under 500 characters', () => {
    const result = buildResumePrompt('/Users/alice/my-project');
    expect(result.length).toBeLessThan(500);
  });

  it('is a synchronous pure function with no side effects', () => {
    const result1 = buildResumePrompt('/project');
    const result2 = buildResumePrompt('/project');
    expect(result1).toBe(result2);
  });
});
