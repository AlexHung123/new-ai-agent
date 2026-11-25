import { describe, expect, it } from 'vitest';
import {
  keywordFallbackArgs,
  mapDochubQueryArgs,
  semanticSearchFallbackReason,
  usesSemanticSearch,
} from './dochubQuery';

describe('mapDochubQueryArgs', () => {
  it('maps lex-only searches to mode search without flattening away the searches', () => {
    expect(
      mapDochubQueryArgs({
        searches: [{ type: 'lex', query: 'quarterly plan' }],
        limit: 5,
      }),
    ).toEqual({
      ok: true,
      mode: 'search',
      limit: 5,
      searches: [{ type: 'lex', query: 'quarterly plan' }],
    });
  });

  it('keeps mixed searches and intent for query mode', () => {
    expect(
      mapDochubQueryArgs({
        intent: 'Find the OKR note',
        searches: [
          { type: 'lex', query: 'OKR' },
          { type: 'hyde', query: 'A note about quarterly OKRs' },
        ],
        limit: 10,
        rerank: false,
        minScore: 0.2,
        candidateLimit: 20,
      }),
    ).toEqual({
      ok: true,
      mode: 'query',
      limit: 10,
      intent: 'Find the OKR note',
      searches: [
        { type: 'lex', query: 'OKR' },
        { type: 'hyde', query: 'A note about quarterly OKRs' },
      ],
      rerank: false,
      minScore: 0.2,
      candidateLimit: 20,
    });
  });

  it('prefers searches over a bare query string', () => {
    expect(
      mapDochubQueryArgs({
        query: 'ignored',
        searches: [{ type: 'lex', query: 'kept' }],
      }),
    ).toMatchObject({
      ok: true,
      mode: 'search',
      searches: [{ type: 'lex', query: 'kept' }],
    });
    expect(mapDochubQueryArgs({
      query: 'ignored',
      searches: [{ type: 'lex', query: 'kept' }],
    })).not.toMatchObject({ query: 'ignored' });
  });

  it('uses a bare query string when there are no searches', () => {
    expect(mapDochubQueryArgs({ query: 'hello' })).toMatchObject({
      ok: true,
      query: 'hello',
      mode: 'search',
    });
    expect(mapDochubQueryArgs({ query: 'hello', mode: 'vsearch' })).toMatchObject({
      ok: true,
      query: 'hello',
      mode: 'vsearch',
    });
    expect(mapDochubQueryArgs({ query: 'hello', mode: 'query' })).toMatchObject({
      ok: true,
      query: 'hello',
      mode: 'query',
    });
    expect(
      mapDochubQueryArgs({ query: ['OKR', 'quarterly plan'] }),
    ).toMatchObject({
      ok: true,
      mode: 'search',
      query: 'OKR',
      queries: ['OKR', 'quarterly plan'],
    });
  });

  it('returns query is required when empty', () => {
    expect(mapDochubQueryArgs({})).toEqual({
      ok: false,
      error: 'query is required',
    });
    expect(mapDochubQueryArgs({ user_id: 'alice' }).ok).toBe(false);
  });

  it('defaults limit to 20, clamps to 1..50, and keeps a safe path', () => {
    expect(mapDochubQueryArgs({ query: 'q' })).toMatchObject({
      ok: true,
      limit: 20,
    });
    expect(mapDochubQueryArgs({ query: 'q', limit: 99 })).toMatchObject({
      ok: true,
      limit: 50,
    });
    expect(mapDochubQueryArgs({ query: 'q', limit: 40 })).toMatchObject({
      ok: true,
      limit: 40,
    });
    expect(mapDochubQueryArgs({ query: 'q', path: 'contracts/2024' })).toMatchObject({
      ok: true,
      path: 'contracts/2024',
    });
    expect(mapDochubQueryArgs({ query: 'q', path: '../etc' }).path).toBeUndefined();
  });

  it('detects semantic search and builds a keyword fallback', () => {
    const hybrid = mapDochubQueryArgs({
      query: 'OKR',
      mode: 'query',
    });
    expect(hybrid.ok).toBe(true);
    if (!hybrid.ok) return;
    expect(usesSemanticSearch(hybrid)).toBe(true);
    expect(keywordFallbackArgs(hybrid)).toEqual({ mode: 'search', query: 'OKR' });
    const bare = mapDochubQueryArgs({ query: 'OKR' });
    expect(bare.ok).toBe(true);
    if (!bare.ok) return;
    expect(usesSemanticSearch(bare)).toBe(false);
    expect(semanticSearchFallbackReason(new Error('Embeddings are not ready'))).toBe(
      'semantic_not_ready',
    );
    expect(semanticSearchFallbackReason(new Error('hybrid search timed out after 20s'))).toBe(
      'timeout',
    );
    expect(semanticSearchFallbackReason(new Error('hybrid search busy'))).toBe('busy');
    expect(semanticSearchFallbackReason(new Error('file not found'))).toBeNull();
  });
});
