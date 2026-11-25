import type { KnowledgeSearchMode } from './types';

const MODES = new Set<KnowledgeSearchMode>(['search', 'vsearch', 'query']);

export function normalizeSearchRequest(
  body: unknown,
):
  | { ok: true; query: string; mode: KnowledgeSearchMode; limit: number }
  | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'query is required' };
  }
  const record = body as Record<string, unknown>;
  const query = typeof record.query === 'string' ? record.query.trim() : '';
  if (!query) return { ok: false, message: 'query is required' };

  const modeRaw = record.mode === undefined ? 'search' : record.mode;
  if (typeof modeRaw !== 'string' || !MODES.has(modeRaw as KnowledgeSearchMode)) {
    return { ok: false, message: 'mode must be search, vsearch, or query' };
  }

  let limit = 10;
  if (record.limit !== undefined) {
    if (typeof record.limit !== 'number' || !Number.isInteger(record.limit)) {
      return { ok: false, message: 'limit must be an integer from 1 to 50' };
    }
    limit = record.limit;
  }
  if (limit < 1 || limit > 50) {
    return { ok: false, message: 'limit must be an integer from 1 to 50' };
  }

  return { ok: true, query, mode: modeRaw as KnowledgeSearchMode, limit };
}

export function stripQmdMarkdownPath(file: string): string {
  const prefix = 'qmd://markdown/';
  if (file.startsWith(prefix)) return file.slice(prefix.length);
  return file;
}

export type KnowledgeToolHit = {
  source: string;
  path: string;
  line?: number;
  snippet: string;
  query?: string;
};

const SNIPPET_CHARS = 200;

export function clipSnippet(text: string, max = SNIPPET_CHARS): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1))}…`;
}

function hitPath(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  return stripQmdMarkdownPath(raw.trim());
}

export function hitsFromSearchResults(
  results: unknown[],
  source: string,
  limit: number,
): KnowledgeToolHit[] {
  const hits: KnowledgeToolHit[] = [];
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

export function mergeSearchHits<T extends KnowledgeToolHit>(
  groups: T[][],
  opts: { limit: number; limitPerSource: number },
): T[] {
  const cap = Math.max(1, Math.floor(opts.limit) || 1);
  const perSource = Math.max(1, Math.floor(opts.limitPerSource) || 1);
  const seen = new Set<string>();
  const sourceCount = new Map<string, number>();
  const cursors = groups.map(() => 0);
  const out: T[] = [];
  let progressed = true;
  while (out.length < cap && progressed) {
    progressed = false;
    for (let i = 0; i < groups.length && out.length < cap; i += 1) {
      const group = groups[i]!;
      while (cursors[i]! < group.length) {
        const hit = group[cursors[i]++]!;
        const key = `${hit.path}\t${hit.line ?? ''}`;
        if (seen.has(key)) continue;
        const used = sourceCount.get(hit.source) || 0;
        if (used >= perSource) continue;
        seen.add(key);
        sourceCount.set(hit.source, used + 1);
        out.push(hit);
        progressed = true;
        break;
      }
    }
  }
  return out;
}
