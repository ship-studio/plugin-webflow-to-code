/**
 * Cross-platform shell helpers.
 *
 * Ship Studio's shell.exec() spawns commands directly without a shell. The
 * previous implementation shelled out to macOS/POSIX-only tools (osascript,
 * ditto, bash, mkdir -p, cp -r, pbcopy), which fail outright on Windows
 * (ship-studio/ship-studio#659). Filesystem work now goes through Node
 * one-liners — Node is guaranteed by Ship Studio's setup — with payloads and
 * paths passed via argv (never interpolated into shell strings), so the same
 * code runs on macOS, Linux, and Windows and path/content metacharacters are
 * inert. Only genuinely platform-specific surfaces (file picker, zip
 * extraction, clipboard) branch on IS_WINDOWS.
 *
 * All timeouts are in SECONDS (the plugin shell API contract).
 */

import type { Shell } from './types';

export const IS_WINDOWS =
  typeof navigator !== 'undefined' &&
  (/Windows/i.test(navigator.userAgent || '') ||
    /Win/i.test((navigator as { platform?: string }).platform || ''));

/** Timeout (seconds) for quick local Node one-liners (read/write/mkdir/count). */
export const QUICK_TIMEOUT = 15;

export type ExecResult = { exit_code: number; stdout: string; stderr: string };

/** UTF-8-safe base64 encode (btoa alone mangles multi-byte chars). */
export function encodeBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

/** Decode base64 → bytes → UTF-8 (plain atob returns Latin-1 and mojibakes UTF-8). */
export function decodeBase64(encoded: string): string {
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

/** Escape a literal for a single-quoted PowerShell string. */
export function quoteForPowerShell(value: string): string {
  return "'" + value.replace(/'/g, "''") + "'";
}

/**
 * Read a file and return its contents base64-encoded on stdout.
 * Returns the raw exec result so callers keep their own error handling.
 */
export function readFileBase64(shell: Shell, path: string): Promise<ExecResult> {
  return shell.exec(
    'node',
    [
      '-e',
      "process.stdout.write(require('fs').readFileSync(process.argv[1]).toString('base64'))",
      path,
    ],
    { timeout: QUICK_TIMEOUT },
  );
}

/**
 * Base64 payload chunk size per exec call. Payloads travel via argv, which on
 * Windows shares the process command line (~32k ceiling) — large payloads are
 * written in independently-decodable chunks. Must be a multiple of 4.
 */
const B64_CHUNK = 6000;

/**
 * Write a base64 payload to a file via Node, decoding it, in argv-safe chunks.
 * Creates parent directories. Cross-platform replacement for
 * `bash -c "echo <b64> | base64 -d > file"`. Throws on failure.
 */
export async function writeBase64File(shell: Shell, encoded: string, path: string): Promise<void> {
  const script =
    "const fs=require('fs'),p=require('path');" +
    'fs.mkdirSync(p.dirname(process.argv[2]),{recursive:true});' +
    "fs.writeFileSync(process.argv[2],Buffer.from(process.argv[1],'base64'),{flag:process.argv[3]})";
  for (let i = 0; i === 0 || i < encoded.length; i += B64_CHUNK) {
    const chunk = encoded.slice(i, i + B64_CHUNK);
    const flag = i === 0 ? 'w' : 'a';
    const result = await shell.exec('node', ['-e', script, chunk, path, flag], {
      timeout: QUICK_TIMEOUT,
    });
    if (result.exit_code !== 0) {
      throw new Error(result.stderr || `write failed (exit code ${result.exit_code})`);
    }
  }
}

/** `mkdir -p` equivalent. Returns the raw exec result. */
export function makeDir(shell: Shell, dir: string): Promise<ExecResult> {
  return shell.exec(
    'node',
    ['-e', "require('fs').mkdirSync(process.argv[1],{recursive:true})", dir],
    { timeout: QUICK_TIMEOUT },
  );
}

/** Whether a directory exists (`test -d` equivalent). */
export async function dirExists(shell: Shell, dir: string): Promise<boolean> {
  const result = await shell.exec(
    'node',
    [
      '-e',
      "const fs=require('fs');process.stdout.write(fs.existsSync(process.argv[1])&&fs.statSync(process.argv[1]).isDirectory()?'1':'0')",
      dir,
    ],
    { timeout: QUICK_TIMEOUT },
  );
  return result.exit_code === 0 && result.stdout.trim() === '1';
}

/**
 * Recursively copy a directory's contents into destDir (`cp -r src/. dest/`
 * equivalent). Returns the raw exec result. timeoutSeconds defaults generous
 * because asset folders (videos) can be large.
 */
export function copyDir(
  shell: Shell,
  srcDir: string,
  destDir: string,
  timeoutSeconds = 120,
): Promise<ExecResult> {
  return shell.exec(
    'node',
    [
      '-e',
      "require('fs').cpSync(process.argv[1],process.argv[2],{recursive:true})",
      srcDir,
      destDir,
    ],
    { timeout: timeoutSeconds },
  );
}

/** Count regular files recursively under dir (`find dir -type f | wc -l` equivalent). */
export async function countFiles(shell: Shell, dir: string): Promise<number> {
  const script =
    "const fs=require('fs'),p=require('path');let n=0;" +
    'const w=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){' +
    'const f=p.join(d,e.name);if(e.isDirectory())w(f);else if(e.isFile())n++}};' +
    'w(process.argv[1]);process.stdout.write(String(n))';
  const result = await shell.exec('node', ['-e', script, dir], { timeout: QUICK_TIMEOUT });
  if (result.exit_code !== 0) return NaN;
  return parseInt(result.stdout.trim(), 10);
}
