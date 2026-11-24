import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveFsPath, shouldIgnoreDirName } from '@/lib/search/shared/tools/fs/fsPath';
import { stripQmdMarkdownPath } from './search';

export type WikiGrepHit = {
  source: string;
  path: string;
  line?: number;
  snippet: string;
};

const IGNORE_DIRS = new Set([
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
  '.qmd',
  '.provided',
]);

const MAX_FILE_BYTES = 1 * 1024 * 1024;
const SNIPPET_CHARS = 200;
const MAX_HITS_PER_FILE = 20;

function grepFileRank(rel: string): number {
  const n = (rel || '').replace(/\\/g, '/');
  if (/(^|\/)chunks\//.test(n)) return 1;
  return 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function looksLikeTextBuffer(buf: Buffer): boolean {
  if (buf.length === 0) return true;
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  if (sample.includes(0)) return false;
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i]!;
    if (b === 9 || b === 10 || b === 13 || (b >= 32 && b !== 127) || b >= 0x80) {
      printable++;
    }
  }
  return printable / sample.length >= 0.85;
}

function toUtf8(buf: Buffer): string {
  if (
    buf.length >= 3 &&
    buf[0] === 0xef &&
    buf[1] === 0xbb &&
    buf[2] === 0xbf
  ) {
    return buf.subarray(3).toString('utf8');
  }
  return buf.toString('utf8');
}

export function clipSnippet(text: string, max = SNIPPET_CHARS): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1))}…`;
}

export function compileWikiGrepQuery(
  query: string,
  caseInsensitive = true,
): RegExp | { error: string } {
  const source = query.trim();
  if (!source) return { error: 'query is required' };
  try {
    return new RegExp(escapeRegExp(source), caseInsensitive ? 'i' : '');
  } catch {
    return { error: 'invalid query' };
  }
}

export function joinWikiHitPath(scopePath: string, rel: string): string {
  const clean = rel.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!clean || clean === '.') return scopePath;
  if (clean === scopePath || clean.startsWith(`${scopePath}/`)) return clean;
  return `${scopePath}/${clean}`;
}

export function grepWikiRoot(opts: {
  rootAbs: string;
  query: string;
  subpath?: string;
  limit: number;
  caseInsensitive?: boolean;
}): WikiGrepHit[] | { error: string } {
  const limit = Math.max(1, Math.floor(opts.limit) || 1);
  const re = compileWikiGrepQuery(opts.query, opts.caseInsensitive !== false);
  if ('error' in re) return re;
  const start = resolveFsPath(opts.rootAbs, opts.subpath || '.', {
    mustExist: true,
  });
  if (!start.ok) return { error: start.message };

  type FileHit = { rel: string; lines: Array<{ line: number; text: string }> };
  const files: FileHit[] = [];

  const scanFile = (abs: string, rel: string) => {
    let buf: Buffer;
    try {
      buf = readFileSync(abs);
    } catch {
      return;
    }
    if (buf.length > MAX_FILE_BYTES) return;
    if (!looksLikeTextBuffer(buf)) return;
    const lines = toUtf8(buf)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n');
    const stored: FileHit['lines'] = [];
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i] ?? '';
      if (!re.test(lineText)) continue;
      re.lastIndex = 0;
      if (stored.length < MAX_HITS_PER_FILE) {
        stored.push({ line: i + 1, text: clipSnippet(lineText) });
      }
    }
    if (stored.length) files.push({ rel, lines: stored });
  };

  const walk = (absDir: string, relDir: string) => {
    let names: string[];
    try {
      names = readdirSync(absDir);
    } catch {
      return;
    }
    for (const name of names) {
      if (shouldIgnoreDirName(name, IGNORE_DIRS)) continue;
      const abs = join(absDir, name);
      const rel = !relDir || relDir === '.' ? name : `${relDir}/${name}`;
      let isDir = false;
      let isFile = false;
      try {
        const st = statSync(abs);
        isDir = st.isDirectory();
        isFile = st.isFile();
      } catch {
        continue;
      }
      const child = resolveFsPath(opts.rootAbs, rel);
      if (!child.ok) continue;
      if (isDir) walk(child.abs, child.rel === '.' ? '' : child.rel);
      else if (isFile) scanFile(child.abs, child.rel);
    }
  };

  if (start.isFile) {
    scanFile(start.abs, start.rel === '.' ? '' : start.rel);
  } else if (start.isDirectory) {
    walk(start.abs, start.rel === '.' ? '' : start.rel);
  }

  files.sort((a, b) => {
    const rank = grepFileRank(a.rel) - grepFileRank(b.rel);
    if (rank !== 0) return rank;
    return a.rel.localeCompare(b.rel);
  });

  const hits: WikiGrepHit[] = [];
  for (const file of files) {
    for (const line of file.lines) {
      if (hits.length >= limit) return hits;
      hits.push({
        source: '',
        path: file.rel,
        line: line.line,
        snippet: line.text,
      });
    }
  }
  return hits;
}

function hitPath(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  return stripQmdMarkdownPath(raw.trim());
}

export function hitsFromSearchResults(
  results: unknown[],
  source: string,
  limit: number,
): WikiGrepHit[] {
  const hits: WikiGrepHit[] = [];
  for (const item of results) {
    if (hits.length >= limit) break;
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const path =
      hitPath(rec.dochub_path) ||
      hitPath(rec.path) ||
      hitPath(rec.file) ||
      hitPath(rec.filepath);
    if (!path) continue;
    const snippetRaw =
      (typeof rec.snippet === 'string' && rec.snippet) ||
      (typeof rec.text === 'string' && rec.text) ||
      (typeof rec.content === 'string' && rec.content) ||
      (typeof rec.preview === 'string' && rec.preview) ||
      '';
    const line =
      typeof rec.line === 'number' && Number.isFinite(rec.line)
        ? Math.max(1, Math.floor(rec.line))
        : undefined;
    hits.push({
      source,
      path,
      ...(line ? { line } : {}),
      snippet: clipSnippet(snippetRaw),
    });
  }
  return hits;
}
