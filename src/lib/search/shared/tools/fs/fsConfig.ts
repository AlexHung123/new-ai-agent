/**
 * Chrooted project filesystem tools (read-only) — env knobs.
 * Disabled by default until AGENT_FS_ENABLED=true and AGENT_FS_ROOT is set.
 */

import { isAbsolute, resolve } from 'node:path';

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

function envPositiveInt(
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number(process.env[key] ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function envBytes(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const s = raw.trim().toLowerCase();
  const m = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/.exec(s);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  }
  const n = Number(m[1]);
  const unit = m[2] || 'b';
  const mult =
    unit === 'gb'
      ? 1024 ** 3
      : unit === 'mb'
        ? 1024 ** 2
        : unit === 'kb'
          ? 1024
          : 1;
  return Math.floor(n * mult);
}

const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
];

export type AgentFsConfig = {
  /** Master switch — tools not registered when false. */
  enabled: boolean;
  /** Absolute resolved root; empty when unset. */
  root: string;
  /** When true, only users with role=admin may use fs_* tools. */
  adminOnly: boolean;
  maxReadBytes: number;
  maxLsEntries: number;
  maxLsDepth: number;
  maxGrepHits: number;
  maxGrepFileBytes: number;
  maxFindResults: number;
  /** Directory basenames to skip in recursive walk. */
  ignoreDirNames: Set<string>;
};

export function getAgentFsConfig(): AgentFsConfig {
  const rootRaw = (process.env.AGENT_FS_ROOT || '').trim();
  const root = rootRaw
    ? isAbsolute(rootRaw)
      ? resolve(rootRaw)
      : resolve(process.cwd(), rootRaw)
    : '';

  const ignoreRaw = (process.env.AGENT_FS_IGNORE_DIRS || '').trim();
  const ignoreList = ignoreRaw
    ? ignoreRaw
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_IGNORE;

  return {
    enabled: envBool('AGENT_FS_ENABLED', false) && root.length > 0,
    root,
    adminOnly: envBool('AGENT_FS_ADMIN_ONLY', true),
    maxReadBytes: envBytes('AGENT_FS_MAX_READ_BYTES', 200 * 1024),
    maxLsEntries: envPositiveInt('AGENT_FS_MAX_LS_ENTRIES', 500, 10, 5_000),
    maxLsDepth: envPositiveInt('AGENT_FS_MAX_LS_DEPTH', 3, 0, 20),
    maxGrepHits: envPositiveInt('AGENT_FS_MAX_GREP_HITS', 40, 1, 500),
    maxGrepFileBytes: envBytes('AGENT_FS_MAX_GREP_FILE_BYTES', 1 * 1024 * 1024),
    maxFindResults: envPositiveInt('AGENT_FS_MAX_FIND_RESULTS', 200, 1, 2_000),
    ignoreDirNames: new Set(ignoreList.map((s) => s.toLowerCase())),
  };
}

export function isAgentFsEnabled(): boolean {
  return getAgentFsConfig().enabled;
}
