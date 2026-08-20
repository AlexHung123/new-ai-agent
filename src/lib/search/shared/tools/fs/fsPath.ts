/**
 * Path chroot helpers for agent FS tools (read-only).
 * All user-supplied paths must resolve under the document root.
 */

import { existsSync, lstatSync, realpathSync, statSync } from 'node:fs';
import {
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep,
} from 'node:path';

export type ResolvedFsPath =
  | {
      ok: true;
      /** Absolute real path on disk. */
      abs: string;
      /** Path relative to root using forward slashes (for model-facing output). */
      rel: string;
      isDirectory: boolean;
      isFile: boolean;
      size: number;
    }
  | { ok: false; message: string };

function toPosixRel(root: string, abs: string): string {
  const rel = relative(root, abs);
  if (!rel || rel === '.') return '.';
  return rel.split(/[/\\]/).join('/');
}

function isInsideRoot(root: string, candidate: string): boolean {
  const r = resolve(root);
  const c = resolve(candidate);
  const rootCmp = process.platform === 'win32' ? r.toLowerCase() : r;
  const candCmp = process.platform === 'win32' ? c.toLowerCase() : c;
  const rootWithSep = rootCmp.endsWith(sep) ? rootCmp : rootCmp + sep;
  return candCmp === rootCmp || candCmp.startsWith(rootWithSep);
}

/**
 * Resolve a user path (relative to root, or absolute if still under root)
 * and verify it stays inside the chroot after realpath.
 */
export function resolveFsPath(
  root: string,
  userPath: string | undefined | null,
  opts?: { mustExist?: boolean },
): ResolvedFsPath {
  const mustExist = opts?.mustExist !== false;
  const rootAbs = resolve(root);
  if (!rootAbs || !existsSync(rootAbs)) {
    return {
      ok: false,
      message: `FS root is not available: ${rootAbs || '(empty)'}`,
    };
  }

  let rootReal: string;
  try {
    rootReal = realpathSync(rootAbs);
  } catch {
    return { ok: false, message: `FS root is not readable: ${rootAbs}` };
  }

  const raw = (userPath ?? '.').trim() || '.';
  if (raw.includes('\0')) {
    return { ok: false, message: 'Invalid path' };
  }

  let candidate: string;
  if (isAbsolute(raw)) {
    candidate = resolve(raw);
  } else {
    const cleaned = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, '');
    candidate = resolve(join(rootReal, cleaned));
  }

  if (!isInsideRoot(rootReal, candidate)) {
    return {
      ok: false,
      message: `Path escapes FS root: ${raw}`,
    };
  }

  if (!existsSync(candidate)) {
    if (mustExist) {
      return {
        ok: false,
        message: `Path not found: ${toPosixRel(rootReal, candidate)}`,
      };
    }
    return {
      ok: true,
      abs: candidate,
      rel: toPosixRel(rootReal, candidate),
      isDirectory: false,
      isFile: false,
      size: 0,
    };
  }

  let real: string;
  try {
    real = realpathSync(candidate);
  } catch {
    return {
      ok: false,
      message: `Path not accessible: ${toPosixRel(rootReal, candidate)}`,
    };
  }

  if (!isInsideRoot(rootReal, real)) {
    return {
      ok: false,
      message: `Symlink escapes FS root: ${toPosixRel(rootReal, candidate)}`,
    };
  }

  let st;
  try {
    st = statSync(real);
  } catch {
    return {
      ok: false,
      message: `Path not accessible: ${toPosixRel(rootReal, candidate)}`,
    };
  }

  return {
    ok: true,
    abs: real,
    rel: toPosixRel(rootReal, real),
    isDirectory: st.isDirectory(),
    isFile: st.isFile(),
    size: st.size,
  };
}

/** True if basename should be skipped in recursive walks. */
export function shouldIgnoreDirName(
  name: string,
  ignore: Set<string>,
): boolean {
  return ignore.has(name.toLowerCase());
}

/** Quick lstat without following (for listing). */
export function lstatKind(
  abs: string,
): 'file' | 'dir' | 'symlink' | 'other' | 'missing' {
  try {
    const st = lstatSync(abs);
    if (st.isSymbolicLink()) return 'symlink';
    if (st.isDirectory()) return 'dir';
    if (st.isFile()) return 'file';
    return 'other';
  } catch {
    return 'missing';
  }
}
