import { describe, expect, it } from 'vitest';
import { mapDochubQueryArgs } from './dochubQuery';

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
    expect(mapDochubQueryArgs({ query: 'hello', mode: 'vsearch' })).toMatchObject({
      ok: true,
      query: 'hello',
      mode: 'vsearch',
    });
  });

  it('returns query is required when empty', () => {
    expect(mapDochubQueryArgs({})).toEqual({
      ok: false,
      error: 'query is required',
    });
    expect(mapDochubQueryArgs({ user_id: 'alice' }).ok).toBe(false);
  });

  it('clamps limit to 1..10 and keeps a safe path', () => {
    expect(mapDochubQueryArgs({ query: 'q', limit: 99 })).toMatchObject({
      ok: true,
      limit: 10,
    });
    expect(mapDochubQueryArgs({ query: 'q', path: 'contracts/2024' })).toMatchObject({
      ok: true,
      path: 'contracts/2024',
    });
    expect(mapDochubQueryArgs({ query: 'q', path: '../etc' }).path).toBeUndefined();
  });
});
