import { describe, expect, it } from 'vitest';
import {
  clipSnippet,
  hitsFromSearchResults,
  mergeSearchHits,
  normalizeSearchRequest,
  stripQmdMarkdownPath,
} from './search';

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

describe('hitsFromSearchResults', () => {
  it('normalizes search hits and prefixes library paths', () => {
    const hits = hitsFromSearchResults(
      [
        {
          file: 'qmd://markdown/g3/wiki/index.md',
          line: 4,
          snippet: '  Access control  ',
        },
        { path: 's17/wiki/chapters/02.md', text: 'A long '.repeat(80) },
      ],
      'public:g3',
      5,
    );
    expect(hits[0]).toEqual({
      source: 'public:g3',
      path: 'g3/wiki/index.md',
      line: 4,
      snippet: 'Access control',
    });
    expect(hits[1]?.path).toBe('s17/wiki/chapters/02.md');
    expect(hits[1]?.snippet.endsWith('…')).toBe(true);
    expect(clipSnippet('x'.repeat(201)).length).toBe(200);
  });
});

describe('mergeSearchHits', () => {
  it('round-robins queries, dedupes by path and line, and caps the total', () => {
    const merged = mergeSearchHits(
      [
        [
          { source: 'private:contracts', path: 'a.md', line: 1, snippet: 'okr 1', query: 'OKR' },
          { source: 'private:contracts', path: 'a.md', line: 2, snippet: 'okr 2', query: 'OKR' },
          { source: 'private:contracts', path: 'c.md', line: 1, snippet: 'okr 3', query: 'OKR' },
        ],
        [
          { source: 'private:contracts', path: 'a.md', line: 1, snippet: 'dup', query: 'quarterly plan' },
          { source: 'private:contracts', path: 'b.md', line: 1, snippet: 'plan', query: 'quarterly plan' },
        ],
      ],
      { limit: 3, limitPerSource: 10 },
    );
    expect(merged.map((hit) => `${hit.query}:${hit.path}:${hit.line}`)).toEqual([
      'OKR:a.md:1',
      'quarterly plan:b.md:1',
      'OKR:a.md:2',
    ]);
  });
});
