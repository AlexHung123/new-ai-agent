import { describe, expect, it } from 'vitest';
import { mapDochubQueryArgs } from './dochubQuery';

describe('mapDochubQueryArgs', () => {
  it('maps lex-only searches to mode search', () => {
    expect(
      mapDochubQueryArgs({
        searches: [{ type: 'lex', query: 'quarterly plan' }],
        limit: 5,
      }),
    ).toEqual({
      ok: true,
      query: 'quarterly plan',
      mode: 'search',
      limit: 5,
    });
  });

  it('maps vec-only searches to vsearch', () => {
    expect(
      mapDochubQueryArgs({
        searches: [{ type: 'vec', query: 'cockpit instruments' }],
      }),
    ).toMatchObject({
      ok: true,
      mode: 'vsearch',
      query: 'cockpit instruments',
      limit: 5,
    });
  });

  it('maps mixed searches to query mode using intent', () => {
    expect(
      mapDochubQueryArgs({
        intent: 'Find the OKR note',
        searches: [
          { type: 'lex', query: 'OKR' },
          { type: 'hyde', query: 'A note about quarterly OKRs' },
        ],
        limit: 10,
      }),
    ).toMatchObject({
      ok: true,
      mode: 'query',
      query: 'Find the OKR note',
      limit: 10,
    });
  });

  it('prefers searches over a bare query string', () => {
    expect(
      mapDochubQueryArgs({
        query: 'ignored',
        searches: [{ type: 'lex', query: 'kept' }],
      }),
    ).toMatchObject({ ok: true, query: 'kept', mode: 'search' });
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
