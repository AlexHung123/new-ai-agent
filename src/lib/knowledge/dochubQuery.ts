import { isSafeRelativePath } from './paths';
import type { KnowledgeSearchMode } from './types';

const MODES = new Set<KnowledgeSearchMode>(['search', 'vsearch', 'query']);
const SEARCH_TYPES = new Set(['lex', 'vec', 'hyde']);

export type MappedDochubSearch = {
  type: 'lex' | 'vec' | 'hyde';
  query: string;
};

export type MappedDochubQuery =
  | {
      ok: true;
      mode: KnowledgeSearchMode;
      limit: number;
      path?: string;
      query?: string;
      searches?: MappedDochubSearch[];
      intent?: string;
      rerank?: boolean;
      minScore?: number;
      candidateLimit?: number;
    }
  | { ok: false; error: string };

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object' ? (args as Record<string, unknown>) : {};
}

function clampLimit(value: unknown): number {
  const n = typeof value === 'number' && Number.isInteger(value) ? value : 5;
  return Math.min(10, Math.max(1, n));
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function parseSearches(raw: unknown): MappedDochubSearch[] {
  if (!Array.isArray(raw)) return [];
  const out: MappedDochubSearch[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const type = typeof row.type === 'string' ? row.type : '';
    const query = typeof row.query === 'string' ? row.query.trim() : '';
    if (!SEARCH_TYPES.has(type) || !query) continue;
    out.push({ type: type as MappedDochubSearch['type'], query });
  }
  return out;
}

export function mapDochubQueryArgs(args: unknown): MappedDochubQuery {
  const rec = asRecord(args);
  const searches = parseSearches(rec.searches);
  const intent = typeof rec.intent === 'string' ? rec.intent.trim() : '';
  const explicitMode =
    typeof rec.mode === 'string' && MODES.has(rec.mode as KnowledgeSearchMode)
      ? (rec.mode as KnowledgeSearchMode)
      : undefined;

  let mode: KnowledgeSearchMode = explicitMode ?? 'query';
  let query: string | undefined;

  if (searches.length > 0) {
    const types = new Set(searches.map((row) => row.type));
    if (!explicitMode && types.size === 1 && types.has('lex') && !intent) {
      mode = 'search';
    } else if (!explicitMode) {
      mode = 'query';
    }
  } else if (typeof rec.query === 'string' && rec.query.trim()) {
    query = rec.query.trim();
    mode = explicitMode ?? 'query';
  }

  if (!searches.length && !query) return { ok: false, error: 'query is required' };

  const mapped: MappedDochubQuery = {
    ok: true,
    mode,
    limit: clampLimit(rec.limit),
  };
  if (query) mapped.query = query;
  if (searches.length) mapped.searches = searches;
  if (intent) mapped.intent = intent;
  if (typeof rec.path === 'string' && isSafeRelativePath(rec.path)) {
    mapped.path = rec.path;
  }
  if (typeof rec.rerank === 'boolean') mapped.rerank = rec.rerank;
  const minScore = asFiniteNumber(rec.minScore ?? rec.min_score);
  if (minScore !== undefined) mapped.minScore = minScore;
  const candidateLimit = rec.candidateLimit ?? rec.candidate_limit;
  if (typeof candidateLimit === 'number' && Number.isInteger(candidateLimit) && candidateLimit >= 1) {
    mapped.candidateLimit = candidateLimit;
  }
  return mapped;
}
