import type { Shell } from '../types';
import type { AssetManifest } from './types';
import { buildManifest } from './manifest';

/**
 * Copy a directory from source to destination if it exists.
 * Skips silently when the source directory is absent (e.g., fonts/ may not exist).
 */
export async function copyDirIfExists(
  shell: Shell,
  srcDir: string,
  destDir: string,
  label: string,
  onProgress?: (label: string) => void,
  timeout?: number,
): Promise<void> {
  const check = await shell.exec('bash', [
    '-c',
    `test -d '${srcDir}' && echo exists || echo absent`,
  ]);
  if (check.stdout.trim() === 'absent') return;

  onProgress?.(label);

  const mkdirResult = await shell.exec('mkdir', ['-p', destDir]);
  if (mkdirResult.exit_code !== 0) {
    throw new Error(`Failed to create directory ${destDir}: ${mkdirResult.stderr.trim()}`);
  }

  const cpResult = await shell.exec(
    'bash',
    ['-c', `cp -r '${srcDir}/.' '${destDir}/'`],
    { timeout: timeout ?? 120000 },
  );
  if (cpResult.exit_code !== 0) {
    throw new Error(`Failed to copy ${srcDir} to ${destDir}: ${cpResult.stderr.trim()}`);
  }
}

/**
 * Copy all asset directories from the extract dir to .shipstudio/assets/.
 * Copies images, videos, fonts, css, and js in order with progress labels.
 * Returns an AssetManifest built from the zip entries.
 */
export async function copyAssets(
  shell: Shell,
  extractDir: string,
  projectPath: string,
  entries: string[],
  onProgress?: (label: string) => void,
): Promise<AssetManifest> {
  const assetsDir = `${projectPath}/.shipstudio/assets`;

  const mkdirResult = await shell.exec('mkdir', ['-p', assetsDir]);
  if (mkdirResult.exit_code !== 0) {
    throw new Error(`Failed to create assets directory: ${mkdirResult.stderr.trim()}`);
  }

  await copyDirIfExists(
    shell, `${extractDir}/images`, `${assetsDir}/images`,
    'Copying images...', onProgress,
  );

  await copyDirIfExists(
    shell, `${extractDir}/videos`, `${assetsDir}/videos`,
    'Copying videos (may take a moment)...', onProgress, 300000,
  );

  await copyDirIfExists(
    shell, `${extractDir}/fonts`, `${assetsDir}/fonts`,
    'Copying fonts...', onProgress,
  );

  await copyDirIfExists(
    shell, `${extractDir}/css`, `${assetsDir}/css`,
    'Copying CSS...', onProgress,
  );

  await copyDirIfExists(
    shell, `${extractDir}/js`, `${assetsDir}/js`,
    'Copying JS...', onProgress,
  );

  return buildManifest(entries, assetsDir, projectPath);
}
