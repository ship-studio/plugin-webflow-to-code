import type { Shell } from '../types';
import {
  IS_WINDOWS,
  encodeBase64,
  writeBase64File,
  quoteForPowerShell,
  QUICK_TIMEOUT,
} from '../platform';

export async function saveBrief(
  shell: Shell,
  projectPath: string,
  markdown: string,
): Promise<void> {
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  // Chunked Node write instead of `bash -c "echo <b64> | base64 -d > file"`
  // (macOS/Linux-only — ship-studio/ship-studio#659).
  try {
    await writeBase64File(shell, encodeBase64(markdown), briefPath);
  } catch (err) {
    throw new Error(`Failed to save brief: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Copy markdown to the system clipboard.
 *
 * macOS: sh pipeline into pbcopy (payload passed via argv, never interpolated
 * into quoted shell text, so content metacharacters are inert).
 * Windows: the payload is staged to a temp file via Node, then PowerShell's
 * Set-Clipboard decodes it — no bash, no pbcopy, no command-line payload.
 * (Same pattern as plugin-figma's brief clipboard.)
 */
export async function copyToClipboard(
  shell: Shell,
  markdown: string,
  isWindows: boolean = IS_WINDOWS,
): Promise<void> {
  const encoded = encodeBase64(markdown);

  if (!isWindows) {
    const result = await shell.exec(
      'sh',
      ['-c', 'printf %s "$0" | base64 -d | pbcopy', encoded],
      { timeout: QUICK_TIMEOUT },
    );
    if (result.exit_code !== 0) {
      throw new Error(`Clipboard copy failed: ${result.stderr}`);
    }
    return;
  }

  // Windows: resolve the OS temp dir, stage the payload, decode into clipboard.
  const tmpResult = await shell.exec(
    'node',
    [
      '-e',
      `process.stdout.write(require('path').join(require('os').tmpdir(),'shipstudio-webflow-brief.b64'))`,
    ],
    { timeout: QUICK_TIMEOUT },
  );
  if (tmpResult.exit_code !== 0 || !tmpResult.stdout.trim()) {
    throw new Error(
      `Clipboard copy failed: ${tmpResult.stderr || 'could not resolve temp dir'}`,
    );
  }
  const tmpPath = tmpResult.stdout.trim();

  try {
    await writeBase64File(shell, encoded, tmpPath);
  } catch (err) {
    throw new Error(`Clipboard copy failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const psPath = quoteForPowerShell(tmpPath);
  const psScript =
    `Set-Clipboard -Value ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String((Get-Content -Raw ${psPath})))); ` +
    `Remove-Item ${psPath} -ErrorAction SilentlyContinue`;
  const result = await shell.exec(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-Command', psScript],
    { timeout: QUICK_TIMEOUT },
  );
  if (result.exit_code !== 0) {
    throw new Error(`Clipboard copy failed: ${result.stderr}`);
  }
}
