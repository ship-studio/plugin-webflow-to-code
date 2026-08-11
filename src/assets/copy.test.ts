import { describe, it, expect, vi } from 'vitest';
import type { Shell } from '../types';
import { copyAssets, copyDirIfExists } from './copy';

function createMockShell(
  responses: Array<{ exit_code: number; stdout: string; stderr: string }>,
): Shell {
  let callIndex = 0;
  return {
    exec: vi.fn(async () => {
      const response = responses[callIndex];
      if (!response) throw new Error(`Unexpected shell.exec call #${callIndex}`);
      callIndex++;
      return response;
    }),
  };
}

const ok = { exit_code: 0, stdout: '', stderr: '' };
// dirExists prints '1' (exists) or '0' (absent) via node
const exists = { exit_code: 0, stdout: '1', stderr: '' };
const absent = { exit_code: 0, stdout: '0', stderr: '' };

const SAMPLE_ENTRIES = [
  'css/',
  'css/normalize.css',
  'css/site.css',
  'images/',
  'images/hero.png',
  'images/logo.svg',
  'videos/',
  'videos/demo.mp4',
  'fonts/',
  'fonts/roboto.woff2',
  'js/',
  'js/webflow.js',
  'index.html',
];

describe('copyAssets', () => {
  it('creates the base assets dir first via node mkdir', async () => {
    const shell = createMockShell([
      ok,       // mkdir assetsDir
      exists, ok, ok,  // images: exists, mkdir, cp
      exists, ok, ok,  // videos: exists, mkdir, cp
      exists, ok, ok,  // fonts: exists, mkdir, cp
      exists, ok, ok,  // css: exists, mkdir, cp
      exists, ok, ok,  // js: exists, mkdir, cp
    ]);

    await copyAssets(shell, '/tmp/out', '/proj', SAMPLE_ENTRIES);

    const calls = (shell.exec as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('node');
    expect(calls[0][1].join(' ')).toContain('mkdirSync');
    expect(calls[0][1]).toContain('/proj/.shipstudio/assets');
  });

  it('checks existence, creates dir, and copies for images — all via node', async () => {
    const shell = createMockShell([
      ok,               // mkdir assetsDir
      exists, ok, ok,   // images
      exists, ok, ok,   // videos
      absent,           // fonts (skipped)
      exists, ok, ok,   // css
      exists, ok, ok,   // js
    ]);

    await copyAssets(shell, '/tmp/out', '/proj', SAMPLE_ENTRIES);

    const calls = (shell.exec as ReturnType<typeof vi.fn>).mock.calls;
    // Call 1 = dir existence check for images
    expect(calls[1][0]).toBe('node');
    expect(calls[1][1]).toContain('/tmp/out/images');
    // Call 2 = mkdir images dest
    expect(calls[2][1].join(' ')).toContain('mkdirSync');
    expect(calls[2][1]).toContain('/proj/.shipstudio/assets/images');
    // Call 3 = recursive copy
    expect(calls[3][1].join(' ')).toContain('cpSync');
    expect(calls[3][1]).toContain('/tmp/out/images');
    expect(calls[3][1]).toContain('/proj/.shipstudio/assets/images');
  });

  it('gives the videos copy a 300 second timeout (seconds, not ms)', async () => {
    const shell = createMockShell([
      ok,               // mkdir assetsDir
      exists, ok, ok,   // images
      exists, ok, ok,   // videos
      absent,           // fonts (skipped)
      exists, ok, ok,   // css
      exists, ok, ok,   // js
    ]);

    await copyAssets(shell, '/tmp/out', '/proj', SAMPLE_ENTRIES);

    const calls = (shell.exec as ReturnType<typeof vi.fn>).mock.calls;
    // videos cp is call index 6 (mkdir:0, img-exists:1, img-mkdir:2, img-cp:3, vid-exists:4, vid-mkdir:5, vid-cp:6)
    expect(calls[6][2]).toEqual({ timeout: 300 });
    // other copies use the 120 second default
    expect(calls[3][2]).toEqual({ timeout: 120 });
  });

  it('skips fonts when the directory is absent', async () => {
    const shell = createMockShell([
      ok,               // mkdir assetsDir
      exists, ok, ok,   // images
      exists, ok, ok,   // videos
      absent,           // fonts: absent, no mkdir/cp
      exists, ok, ok,   // css
      exists, ok, ok,   // js
    ]);

    await copyAssets(shell, '/tmp/out', '/proj', SAMPLE_ENTRIES);

    const calls = (shell.exec as ReturnType<typeof vi.fn>).mock.calls;
    // fonts existence check is call index 7
    expect(calls[7][1]).toContain('/tmp/out/fonts');
    // Next call after fonts check should be css check (no mkdir/cp for fonts)
    expect(calls[8][1]).toContain('/tmp/out/css');
  });

  it('copies css and js directories', async () => {
    const shell = createMockShell([
      ok,               // mkdir assetsDir
      exists, ok, ok,   // images
      exists, ok, ok,   // videos
      absent,           // fonts
      exists, ok, ok,   // css
      exists, ok, ok,   // js
    ]);

    await copyAssets(shell, '/tmp/out', '/proj', SAMPLE_ENTRIES);

    const calls = (shell.exec as ReturnType<typeof vi.fn>).mock.calls;
    // css cp (call 10)
    expect(calls[10][1].join(' ')).toContain('cpSync');
    expect(calls[10][1]).toContain('/tmp/out/css');
    // js cp (call 13)
    expect(calls[13][1].join(' ')).toContain('cpSync');
    expect(calls[13][1]).toContain('/tmp/out/js');
  });

  it('returns AssetManifest from buildManifest', async () => {
    const shell = createMockShell([
      ok,               // mkdir assetsDir
      exists, ok, ok,   // images
      exists, ok, ok,   // videos
      absent,           // fonts
      exists, ok, ok,   // css
      exists, ok, ok,   // js
    ]);

    const manifest = await copyAssets(shell, '/tmp/out', '/proj', SAMPLE_ENTRIES);

    expect(manifest.images).toHaveLength(2); // hero.png + logo.svg
    expect(manifest.videos).toHaveLength(1); // demo.mp4
    expect(manifest.fonts).toHaveLength(1);  // roboto.woff2
    expect(manifest.cssFiles).toHaveLength(2); // normalize + site
    expect(manifest.totalCopied).toBe(7); // 2 images + 1 video + 1 font + 2 css + 1 js
  });

  it('calls onProgress with correct labels in order', async () => {
    const shell = createMockShell([
      ok,               // mkdir assetsDir
      exists, ok, ok,   // images
      exists, ok, ok,   // videos
      absent,           // fonts (skipped — no onProgress call)
      exists, ok, ok,   // css
      exists, ok, ok,   // js
    ]);

    const labels: string[] = [];
    await copyAssets(shell, '/tmp/out', '/proj', SAMPLE_ENTRIES, (label) => {
      labels.push(label);
    });

    expect(labels).toEqual([
      'Copying images...',
      'Copying videos (may take a moment)...',
      // 'Copying fonts...' — skipped because absent
      'Copying CSS...',
      'Copying JS...',
    ]);
  });
});

describe('copyDirIfExists', () => {
  it('throws when cp exits non-zero', async () => {
    const shell = createMockShell([
      exists,
      ok, // mkdir
      { exit_code: 1, stdout: '', stderr: 'Permission denied' },
    ]);

    await expect(
      copyDirIfExists(shell, '/src', '/dest', 'Copying...'),
    ).rejects.toThrow('Failed to copy /src to /dest: Permission denied');
  });

  it('throws when mkdir exits non-zero', async () => {
    const shell = createMockShell([
      exists,
      { exit_code: 1, stdout: '', stderr: 'No space left' },
    ]);

    await expect(
      copyDirIfExists(shell, '/src', '/dest', 'Copying...'),
    ).rejects.toThrow('Failed to create directory /dest: No space left');
  });
});
