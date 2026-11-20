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
