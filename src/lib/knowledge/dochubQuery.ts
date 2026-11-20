import { isSafeRelativePath } from './paths';
import type { KnowledgeSearchMode } from './types';

const MODES = new Set<KnowledgeSearchMode>(['search', 'vsearch', 'query']);

export type MappedDochubQuery =
  | {
      ok: true;
      query: string;
      mode: KnowledgeSearchMode;
      limit: number;
      path?: string;
    }
  | { ok: false; error: string };

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object' ? (args as Record<string, unknown>) : {};
}

function clampLimit(value: unknown): number {
  const n = typeof value === 'number' && Number.isInteger(value) ? value : 5;
  return Math.min(10, Math.max(1, n));
}

export function mapDochubQueryArgs(args: unknown): MappedDochubQuery {
  const rec = asRecord(args);
  const searches = Array.isArray(rec.searches) ? rec.searches : null;
  let query = '';
  let mode: KnowledgeSearchMode = 'query';

  if (searches && searches.length > 0) {
    const typed = searches
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const type = typeof row.type === 'string' ? row.type : '';
        const q = typeof row.query === 'string' ? row.query.trim() : '';
        return q ? { type, query: q } : null;
      })
      .filter((row): row is { type: string; query: string } => Boolean(row));
    const types = new Set(typed.map((row) => row.type));
    const joined = typed.map((row) => row.query).join(' ').trim();
    const intent = typeof rec.intent === 'string' ? rec.intent.trim() : '';
    const hyde = typed.find((row) => row.type === 'hyde')?.query || '';
    if (types.size === 1 && types.has('lex')) {
      mode = 'search';
      query = joined;
    } else if (types.size === 1 && types.has('vec')) {
      mode = 'vsearch';
      query = joined;
    } else {
      mode = 'query';
      query = intent || hyde || joined;
    }
  } else if (typeof rec.query === 'string' && rec.query.trim()) {
    query = rec.query.trim();
    mode =
      typeof rec.mode === 'string' && MODES.has(rec.mode as KnowledgeSearchMode)
        ? (rec.mode as KnowledgeSearchMode)
        : 'query';
  }

  if (!query) return { ok: false, error: 'query is required' };

  const mapped: MappedDochubQuery = {
    ok: true,
    query,
    mode,
    limit: clampLimit(rec.limit),
  };
  if (typeof rec.path === 'string' && isSafeRelativePath(rec.path)) {
    mapped.path = rec.path;
  }
  return mapped;
}
