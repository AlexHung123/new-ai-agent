/**
 * QMD-style fs_read locators: path, path:fromLine, or path:fromLine:maxLines.
 * fromLine is 1-based. Params override a path suffix.
 */

export type FsReadLocator = {
  path: string;
  fromLine?: number;
  maxLines?: number;
};

export function asPositiveInt(value: unknown): number | undefined {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i >= 1 ? i : undefined;
}

function isDriveLetterPath(path: string): boolean {
  return /^[a-zA-Z]$/.test(path);
}

function isDigits(value: string | undefined): value is string {
  return value !== undefined && /^\d+$/.test(value);
}

export function parseFsReadLocator(raw: string): FsReadLocator {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { path: '' };

  const parts = trimmed.split(':');
  const last = parts[parts.length - 1];
  const secondLast = parts.length >= 2 ? parts[parts.length - 2] : undefined;

  if (parts.length >= 3 && isDigits(secondLast) && isDigits(last)) {
    const path = parts.slice(0, -2).join(':');
    if (!path || isDriveLetterPath(path)) return { path: trimmed };
    return {
      path,
      fromLine: Number.parseInt(secondLast, 10),
      maxLines: Number.parseInt(last, 10),
    };
  }

  if (parts.length >= 2 && isDigits(last)) {
    const path = parts.slice(0, -1).join(':');
    if (!path || isDriveLetterPath(path)) return { path: trimmed };
    return { path, fromLine: Number.parseInt(last, 10) };
  }

  return { path: trimmed };
}

const UNLIMITED_LINES = Number.MAX_SAFE_INTEGER;

export function mergeFsReadRange(opts: {
  locator: FsReadLocator;
  fromLine?: unknown;
  maxLines?: unknown;
  maxReadLines: number;
}): { fromLine: number; maxLines: number } {
  const cap =
    opts.maxReadLines <= 0
      ? UNLIMITED_LINES
      : Math.max(1, Math.floor(opts.maxReadLines));
  const fromLine =
    asPositiveInt(opts.fromLine) ??
    asPositiveInt(opts.locator.fromLine) ??
    1;
  const requested =
    asPositiveInt(opts.maxLines) ??
    asPositiveInt(opts.locator.maxLines) ??
    cap;
  return { fromLine, maxLines: Math.min(cap, requested) };
}
