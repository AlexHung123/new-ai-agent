import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  asHtmlPages,
  loadWcmsEnglishPage,
  pickWcmsPageHtml,
} from './wcmsContent';

describe('asHtmlPages', () => {
  it('keeps a postgres text array as pages', () => {
    expect(asHtmlPages(['<p>a</p>', '<p>b</p>'])).toEqual([
      '<p>a</p>',
      '<p>b</p>',
    ]);
  });

  it('treats a bare string as a single page', () => {
    expect(asHtmlPages('<p>only</p>')).toEqual(['<p>only</p>']);
  });

  it('returns an empty list for nullish values', () => {
    expect(asHtmlPages(null)).toEqual([]);
    expect(asHtmlPages(undefined)).toEqual([]);
  });
});

describe('pickWcmsPageHtml', () => {
  it('returns the requested page and clamps out-of-range indexes', () => {
    const pages = ['<p>one</p>', '<p>two</p>'];
    expect(pickWcmsPageHtml(pages, 1)).toEqual({
      html: '<p>two</p>',
      pageIndex: 1,
      pageCount: 2,
    });
    expect(pickWcmsPageHtml(pages, 9).pageIndex).toBe(1);
    expect(pickWcmsPageHtml(pages, -1).pageIndex).toBe(0);
  });

  it('returns empty html when the content has no pages', () => {
    expect(pickWcmsPageHtml(null, 0)).toEqual({
      html: '',
      pageIndex: 0,
      pageCount: 0,
    });
  });
});

describe('queryWcmsContentRow SQL', () => {
  it('selects tiny_mce_content_en with a bound id and deleted_time filter', () => {
    const src = readFileSync(path.join(__dirname, 'wcmsContent.ts'), 'utf8');
    expect(src).toMatch(/tiny_mce_content_en/);
    expect(src).toMatch(/tiny_mce_content_tc/);
    expect(src).toMatch(/tiny_mce_content_sc/);
    expect(src).toMatch(/deleted_time IS NULL/);
    expect(src).toMatch(/WHERE id = \$1/);
  });
});

describe('loadWcmsEnglishPage', () => {
  it('loads tiny_mce_content_en through the injected query', async () => {
    const result = await loadWcmsEnglishPage({
      wcmsContentId: 42,
      pageIndex: 1,
      lang: 'en',
      query: async (id) => {
        expect(id).toBe(42);
        return {
          tiny_mce_content_en: ['<p>en0</p>', '<p>en1</p>'],
          tiny_mce_content_tc: ['<p>tc</p>'],
          title_en: 'Demo page',
          title_tc: '示範',
        };
      },
    });
    expect(result).toEqual({
      ok: true,
      wcmsContentId: 42,
      html: '<p>en1</p>',
      pageIndex: 1,
      pageCount: 2,
      lang: 'en',
      titleEn: 'Demo page',
    });
  });

  it('loads the Traditional Chinese page when lang is tc', async () => {
    const result = await loadWcmsEnglishPage({
      wcmsContentId: 42,
      pageIndex: 0,
      lang: 'tc',
      query: async () => ({
        tiny_mce_content_en: ['<p>en</p>'],
        tiny_mce_content_tc: ['<p>tc0</p>', '<p>tc1</p>'],
        title_tc: '示範',
      }),
    });
    expect(result).toMatchObject({
      ok: true,
      html: '<p>tc0</p>',
      lang: 'tc',
      titleEn: '示範',
    });
  });

  it('returns not found when the row is missing', async () => {
    const result = await loadWcmsEnglishPage({
      wcmsContentId: 99,
      pageIndex: 0,
      lang: 'en',
      query: async () => null,
    });
    expect(result).toEqual({
      ok: false,
      error: 'WCMS content not found',
    });
  });
});
