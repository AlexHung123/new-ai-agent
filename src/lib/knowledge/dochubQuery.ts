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
      queries?: string[];
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

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

function clampLimit(value: unknown): number {
  const n = typeof value === 'number' && Number.isInteger(value) ? value : DEFAULT_SEARCH_LIMIT;
  return Math.min(MAX_SEARCH_LIMIT, Math.max(1, n));
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

function parseQueryList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}

export function mapDochubQueryArgs(args: unknown): MappedDochubQuery {
  const rec = asRecord(args);
  const searches = parseSearches(rec.searches);
  const queries = parseQueryList(rec.query);
  const intent = typeof rec.intent === 'string' ? rec.intent.trim() : '';
  const explicitMode =
    typeof rec.mode === 'string' && MODES.has(rec.mode as KnowledgeSearchMode)
      ? (rec.mode as KnowledgeSearchMode)
      : undefined;

  let mode: KnowledgeSearchMode = explicitMode ?? 'search';
  let query: string | undefined;

  if (searches.length > 0) {
    const types = new Set(searches.map((row) => row.type));
    if (!explicitMode && types.size === 1 && types.has('lex') && !intent) {
      mode = 'search';
    } else if (!explicitMode) {
      mode = 'query';
    }
  } else if (queries.length) {
    query = queries[0];
    mode = explicitMode ?? 'search';
  }

  if (!searches.length && !queries.length) return { ok: false, error: 'query is required' };

  const mapped: MappedDochubQuery = {
    ok: true,
    mode,
    limit: clampLimit(rec.limit),
  };
  if (query) mapped.query = query;
  if (queries.length > 1) mapped.queries = queries;
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

export type MappedDochubSearchRequest = {
  mode: KnowledgeSearchMode;
  query?: string;
  searches?: MappedDochubSearch[];
  intent?: string;
  rerank?: boolean;
  minScore?: number;
  candidateLimit?: number;
};

export function usesSemanticSearch(
  mapped: Extract<MappedDochubQuery, { ok: true }>,
): boolean {
  if (mapped.mode === 'query' || mapped.mode === 'vsearch') return true;
  return Boolean(
    mapped.searches?.some((row) => row.type === 'vec' || row.type === 'hyde'),
  );
}

export function keywordFallbackArgs(
  mapped: Extract<MappedDochubQuery, { ok: true }>,
): MappedDochubSearchRequest {
  const lex = (mapped.searches || []).filter((row) => row.type === 'lex');
  if (lex.length) {
    return {
      mode: 'search',
      query: lex.map((row) => row.query).join(' '),
      searches: lex,
    };
  }
  if (mapped.query) return { mode: 'search', query: mapped.query };
  const queries = (mapped.searches || []).map((row) => row.query).filter(Boolean);
  if (queries.length) return { mode: 'search', query: queries.join(' ') };
  return { mode: 'search' };
}

export function semanticSearchFallbackReason(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const text = `${code} ${message}`.toLowerCase();
  if (/not ready|semantic_not_ready|embeddings/.test(text)) {
    return 'semantic_not_ready';
  }
  if (/timed? out|timeout/.test(text)) return 'timeout';
  if (/\bbusy\b/.test(text)) return 'busy';
  return null;
}

