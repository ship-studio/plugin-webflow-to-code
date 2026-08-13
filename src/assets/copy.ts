import type { Shell } from '../types';
import type { AssetManifest } from './types';
import { buildManifest } from './manifest';
import { dirExists, makeDir, copyDir } from '../platform';

/** Seconds for a directory copy; videos get a longer ceiling below. */
const COPY_TIMEOUT = 120;
const VIDEO_COPY_TIMEOUT = 300;

/**
 * Copy a directory from source to destination if it exists.
 * Skips silently when the source directory is absent (e.g., fonts/ may not exist).
 * All filesystem work goes through Node so it behaves the same on Windows
 * (previously `bash test -d` / `mkdir -p` / `cp -r` — ship-studio/ship-studio#659).
 * timeoutSeconds is in SECONDS (plugin shell API contract).
 */
export async function copyDirIfExists(
  shell: Shell,
  srcDir: string,
  destDir: string,
  label: string,
  onProgress?: (label: string) => void,
  timeoutSeconds?: number,
): Promise<void> {
  if (!(await dirExists(shell, srcDir))) return;

  onProgress?.(label);

  const mkdirResult = await makeDir(shell, destDir);
  if (mkdirResult.exit_code !== 0) {
    throw new Error(`Failed to create directory ${destDir}: ${mkdirResult.stderr.trim()}`);
  }

  const cpResult = await copyDir(shell, srcDir, destDir, timeoutSeconds ?? COPY_TIMEOUT);
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

  const mkdirResult = await makeDir(shell, assetsDir);
  if (mkdirResult.exit_code !== 0) {
    throw new Error(`Failed to create assets directory: ${mkdirResult.stderr.trim()}`);
  }

  await copyDirIfExists(
    shell, `${extractDir}/images`, `${assetsDir}/images`,
    'Copying images...', onProgress,
  );

  await copyDirIfExists(
    shell, `${extractDir}/videos`, `${assetsDir}/videos`,
    'Copying videos (may take a moment)...', onProgress, VIDEO_COPY_TIMEOUT,
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
