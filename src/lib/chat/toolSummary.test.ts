import { describe, expect, it } from 'vitest';
import { buildToolEndSummary } from './toolSummary';

describe('buildToolEndSummary', () => {
  it('summarizes fs_read with the relative file path', () => {
    const out = buildToolEndSummary(
      'fs_read',
      {
        details: {
          ok: true,
          rel: 'wiki/SCHEMA.md',
          truncated: false,
        },
      },
      false,
    );
    expect(out.summary).toBe('Read wiki/SCHEMA.md');
  });

  it('summarizes fs_read with a line range', () => {
    const out = buildToolEndSummary(
      'fs_read',
      {
        details: {
          ok: true,
          rel: 'part-01.md',
          fromLine: 120,
          toLine: 159,
          truncated: true,
        },
      },
      false,
    );
    expect(out.summary).toBe('Read part-01.md · L120-159');
  });

  it('summarizes fs_grep as match count and query', () => {
    const out = buildToolEndSummary(
      'fs_grep',
      {
        details: {
          hitCount: 3,
          query: '轉職',
        },
      },
      false,
    );
    expect(out.summary).toBe('3 matches · 轉職');
    expect(out.hitCount).toBe(3);
  });

  it('summarizes skipped fs_ls with the bound-folder error', () => {
    const out = buildToolEndSummary(
      'fs_ls',
      {
        details: {
          ok: false,
          message: 'No folder bound for this turn.',
          skipped: true,
        },
      },
      false,
    );
    expect(out.summary).toBe('No folder bound for this turn.');
  });

  it('summarizes fs_ls with entry count and path', () => {
    const out = buildToolEndSummary(
      'fs_ls',
      {
        details: {
          entryCount: 12,
          rel: 'wiki',
        },
      },
      false,
    );
    expect(out.summary).toMatch(/Listed 12 entries/);
    expect(out.summary).toMatch(/wiki/);
  });

  it('summarizes fs_find with result count and pattern', () => {
    const out = buildToolEndSummary(
      'fs_find',
      {
        details: {
          resultCount: 4,
          pattern: '*.md',
        },
      },
      false,
    );
    expect(out.summary).toMatch(/Found 4/);
    expect(out.summary).toMatch(/\*\.md/);
  });

  it('reads details from a top-level resultPreview object', () => {
    const out = buildToolEndSummary(
      'fs_read',
      { ok: true, rel: 'wiki/index.md' },
      false,
    );
    expect(out.summary).toBe('Read wiki/index.md');
  });

  it('summarizes es_bm25_search with hit count and query', () => {
    const out = buildToolEndSummary(
      'es_bm25_search',
      {
        details: {
          total: 5,
          chunks: [{ content: 'a' }],
          search_query: '公務員轉職',
        },
      },
      false,
    );
    expect(out.hitCount).toBe(5);
    expect(out.summary).toMatch(/5 hits/);
    expect(out.summary).toMatch(/公務員轉職/);
  });

  it('summarizes guide_search the same way', () => {
    const out = buildToolEndSummary(
      'guide_search',
      {
        details: {
          total: 1,
          chunks: [{ content: 'a' }],
          search_query: 'appointment',
        },
      },
      false,
    );
    expect(out.summary).toMatch(/1 hit/);
    expect(out.summary).toMatch(/appointment/);
  });

  it('summarizes survey cluster tools', () => {
    const out = buildToolEndSummary(
      'process_survey_question',
      {
        details: {
          clusterCount: 3,
          itemCount: 40,
        },
      },
      false,
    );
    expect(out.summary).toMatch(/3 clusters/);
    expect(out.summary).toMatch(/40 answers/);
  });

  it('uses the error message when isError', () => {
    const out = buildToolEndSummary(
      'fs_read',
      { details: { message: 'Not a file: wiki' } },
      true,
    );
    expect(out.summary).toBe('Not a file: wiki');
  });

  it('falls back to Done when there is no structured detail', () => {
    const out = buildToolEndSummary('read_skill', { details: {} }, false);
    expect(out.summary).toBe('Done');
  });
});
