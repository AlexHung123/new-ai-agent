import { describe, expect, it } from 'vitest';
import { normalizeSearchRequest, stripQmdMarkdownPath } from './search';

describe('normalizeSearchRequest', () => {
  it('defaults mode to search and limit to 10', () => {
    expect(normalizeSearchRequest({ query: '  quarterly  ' })).toEqual({
      ok: true,
      query: 'quarterly',
      mode: 'search',
      limit: 10,
    });
  });

  it('accepts vsearch and query modes', () => {
    expect(normalizeSearchRequest({ query: 'q', mode: 'vsearch', limit: 5 })).toMatchObject({
      ok: true,
      mode: 'vsearch',
      limit: 5,
    });
    expect(normalizeSearchRequest({ query: 'q', mode: 'query' })).toMatchObject({
      ok: true,
      mode: 'query',
    });
  });

  it('rejects empty query, unknown mode, and out-of-range limit', () => {
    expect(normalizeSearchRequest({ query: '   ' }).ok).toBe(false);
    expect(normalizeSearchRequest({ query: 'q', mode: 'Search' }).ok).toBe(false);
    expect(normalizeSearchRequest({ query: 'q', limit: 0 }).ok).toBe(false);
    expect(normalizeSearchRequest({ query: 'q', limit: 51 }).ok).toBe(false);
  });
});

describe('stripQmdMarkdownPath', () => {
  it('strips the qmd markdown prefix', () => {
    expect(
      stripQmdMarkdownPath('qmd://markdown/contracts/2024/report.md'),
    ).toBe('contracts/2024/report.md');
  });

  it('returns a non-qmd path unchanged', () => {
    expect(stripQmdMarkdownPath('contracts/2024/report.md')).toBe(
      'contracts/2024/report.md',
    );
  });
});
