/**
 * Compact, user-safe tool outcome summaries for SSE / process UI.
 * Never include full file bodies or large chunk payloads.
 */

export type ToolEndSummary = {
  summary: string;
  hitCount?: number;
};

const MAX_SUMMARY_CHARS = 160;
const MAX_QUERY_CHARS = 80;

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

const DETAIL_KEYS = [
  'sources',
  'hits',
  'query',
  'queries',
  'search_query',
  'chunks',
  'total',
  'rel',
  'hitCount',
  'entryCount',
  'resultCount',
  'pattern',
  'clusterCount',
  'itemCount',
  'message',
] as const;

function detailsFromResult(result: unknown): Record<string, unknown> | null {
  const root = asRecord(result);
  if (!root) return null;
  const details = asRecord(root.details);
  if (details) return details;
  if (DETAIL_KEYS.some((key) => key in root)) return root;
  return null;
}

function countHits(details: Record<string, unknown>): number | undefined {
  if (typeof details.total === 'number' && Number.isFinite(details.total)) {
    return Math.max(0, Math.floor(details.total));
  }
  if (Array.isArray(details.chunks)) return details.chunks.length;
  if (Array.isArray(details.sources)) return details.sources.length;
  if (Array.isArray(details.hits)) return details.hits.length;
  if (typeof details.hitCount === 'number' && Number.isFinite(details.hitCount)) {
    return Math.max(0, Math.floor(details.hitCount));
  }
  return undefined;
}

function firstQuery(details: Record<string, unknown>): string | undefined {
  if (typeof details.query === 'string' && details.query.trim()) {
    return details.query.trim();
  }
  if (typeof details.search_query === 'string' && details.search_query.trim()) {
    return details.search_query.trim();
  }
  if (Array.isArray(details.queries)) {
    const parts = details.queries
      .map((q) => (typeof q === 'string' ? q.trim() : ''))
      .filter(Boolean);
    if (parts.length) return parts.join(' | ');
  }
  return undefined;
}

function errorMessage(
  details: Record<string, unknown> | null,
  isError: boolean,
): string | undefined {
  if (!isError && !details) return undefined;
  const msg =
    (details && typeof details.message === 'string' && details.message.trim()) ||
    (details && typeof details.error === 'string' && details.error.trim()) ||
    undefined;
  return msg;
}

function searchSummary(details: Record<string, unknown> | null): ToolEndSummary {
  const hits = details ? countHits(details) : undefined;
  const q = details ? firstQuery(details) : undefined;
  const hitPart =
    hits === undefined ? 'Search finished' : hits === 1 ? '1 hit' : `${hits} hits`;
  const qPart = q ? ` · ${clip(q, MAX_QUERY_CHARS)}` : '';
  return {
    summary: clip(`${hitPart}${qPart}`, MAX_SUMMARY_CHARS),
    ...(hits !== undefined ? { hitCount: hits } : {}),
  };
}

/**
 * Extract a compact summary for tool_execution_end.
 */
export function buildToolEndSummary(
  toolName: string,
  result: unknown,
  isError: boolean,
): ToolEndSummary {
  const name = (toolName || 'tool').trim() || 'tool';
  const details = detailsFromResult(result);
  const errMsg = errorMessage(details, isError);

  if (isError) {
    return {
      summary: clip(errMsg || 'Failed', MAX_SUMMARY_CHARS),
    };
  }

  if (
    details &&
    details.ok === false &&
    typeof details.message === 'string' &&
    details.message.trim()
  ) {
    return { summary: clip(details.message, MAX_SUMMARY_CHARS) };
  }

  switch (name) {
    case 'es_bm25_search':
    case 'guide_search':
      return searchSummary(details);

    case 'load_survey_questions': {
      const total =
        details && typeof details.total === 'number'
          ? Math.max(0, Math.floor(details.total))
          : undefined;
      return {
        summary: clip(
          total === undefined
            ? 'Survey loaded'
            : total === 1
              ? '1 question'
              : `${total} questions`,
          MAX_SUMMARY_CHARS,
        ),
        ...(total !== undefined ? { hitCount: total } : {}),
      };
    }

    case 'get_question_payload': {
      const n =
        details && typeof details.itemCount === 'number'
          ? Math.max(0, Math.floor(details.itemCount))
          : undefined;
      return {
        summary: clip(
          n === undefined
            ? 'Question loaded'
            : n === 1
              ? '1 answer'
              : `${n} answers`,
          MAX_SUMMARY_CHARS,
        ),
        ...(n !== undefined ? { hitCount: n } : {}),
      };
    }

    case 'cluster_survey_question':
    case 'process_survey_question': {
      const clusters =
        details && typeof details.clusterCount === 'number'
          ? Math.max(0, Math.floor(details.clusterCount))
          : undefined;
      const items =
        details && typeof details.itemCount === 'number'
          ? Math.max(0, Math.floor(details.itemCount))
          : undefined;
      const parts = [
        clusters !== undefined
          ? clusters === 1
            ? '1 cluster'
            : `${clusters} clusters`
          : '',
        items !== undefined
          ? items === 1
            ? '1 answer'
            : `${items} answers`
          : '',
      ].filter(Boolean);
      return {
        summary: clip(parts.join(' · ') || 'Clusters saved', MAX_SUMMARY_CHARS),
        ...(clusters !== undefined ? { hitCount: clusters } : {}),
      };
    }

    case 'assemble_markdown_report':
      return { summary: 'Report ready' };

    case 'fs_ls': {
      const n =
        details && typeof details.entryCount === 'number'
          ? details.entryCount
          : undefined;
      const rel =
        details && typeof details.rel === 'string' ? details.rel : undefined;
      const trunc =
        details && details.truncated === true ? ' · truncated' : '';
      return {
        summary: clip(
          n !== undefined
            ? `Listed ${n} entries${rel ? ` · ${rel}` : ''}${trunc}`
            : 'Listed directory',
          MAX_SUMMARY_CHARS,
        ),
        ...(n !== undefined ? { hitCount: n } : {}),
      };
    }

    case 'fs_read': {
      const rel =
        details && typeof details.rel === 'string' ? details.rel : undefined;
      if (details && details.ok === false && typeof details.message === 'string') {
        return { summary: clip(details.message, MAX_SUMMARY_CHARS) };
      }
      const fromLine =
        details && typeof details.fromLine === 'number'
          ? details.fromLine
          : undefined;
      const toLine =
        details && typeof details.toLine === 'number'
          ? details.toLine
          : undefined;
      const range =
        fromLine !== undefined && toLine !== undefined
          ? ` · L${fromLine}-${toLine}`
          : '';
      return {
        summary: clip(
          rel ? `Read ${rel}${range}` : `Read file${range}`,
          MAX_SUMMARY_CHARS,
        ),
      };
    }

    case 'fs_grep': {
      const hits =
        details && typeof details.hitCount === 'number'
          ? details.hitCount
          : countHits(details || {});
      const q = details ? firstQuery(details) : undefined;
      const hitPart =
        hits === undefined
          ? 'Grep finished'
          : hits === 1
            ? '1 match'
            : `${hits} matches`;
      const qPart = q ? ` · ${clip(q, MAX_QUERY_CHARS)}` : '';
      return {
        summary: clip(`${hitPart}${qPart}`, MAX_SUMMARY_CHARS),
        ...(hits !== undefined ? { hitCount: hits } : {}),
      };
    }

    case 'fs_find': {
      const n =
        details && typeof details.resultCount === 'number'
          ? details.resultCount
          : undefined;
      const pattern =
        details && typeof details.pattern === 'string'
          ? details.pattern
          : undefined;
      return {
        summary: clip(
          n !== undefined
            ? `Found ${n}${pattern ? ` · ${clip(pattern, 40)}` : ''}`
            : 'Find finished',
          MAX_SUMMARY_CHARS,
        ),
        ...(n !== undefined ? { hitCount: n } : {}),
      };
    }

    default: {
      if (
        details &&
        typeof details.summary === 'string' &&
        details.summary.trim()
      ) {
        return { summary: clip(details.summary, MAX_SUMMARY_CHARS) };
      }
      if (errMsg) return { summary: clip(errMsg, MAX_SUMMARY_CHARS) };
      const hits = details ? countHits(details) : undefined;
      if (hits !== undefined) {
        return {
          summary: clip(
            hits === 1 ? '1 result' : `${hits} results`,
            MAX_SUMMARY_CHARS,
          ),
          hitCount: hits,
        };
      }
      const clusters =
        details && typeof details.clusterCount === 'number'
          ? Math.max(0, Math.floor(details.clusterCount))
          : undefined;
      const items =
        details && typeof details.itemCount === 'number'
          ? Math.max(0, Math.floor(details.itemCount))
          : undefined;
      const parts = [
        clusters !== undefined ? `${clusters} clusters` : '',
        items !== undefined ? `${items} answers` : '',
      ].filter(Boolean);
      if (parts.length) {
        return { summary: clip(parts.join(' · '), MAX_SUMMARY_CHARS) };
      }
      return { summary: isError ? 'Failed' : 'Done' };
    }
  }
}
