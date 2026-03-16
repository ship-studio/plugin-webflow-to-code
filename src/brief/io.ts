interface ShellLike {
  exec(
    cmd: string,
    args: string[],
  ): Promise<{ exit_code: number; stdout: string; stderr: string }>;
}

export async function saveBrief(
  shell: ShellLike,
  projectPath: string,
  markdown: string,
): Promise<void> {
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', [
    '-c',
    `echo '${encoded}' | base64 -d > '${briefPath}'`,
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save brief: ${result.stderr}`);
  }
}

export async function copyToClipboard(
  shell: ShellLike,
  markdown: string,
): Promise<void> {
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', [
    '-c',
    `echo '${encoded}' | base64 -d | pbcopy`,
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Clipboard copy failed: ${result.stderr}`);
  }
}
