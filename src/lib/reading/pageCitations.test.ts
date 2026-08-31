import { describe, expect, it } from 'vitest';
import { findPageCitations, injectPageCiteMarkup } from './pageCitations';

describe('findPageCitations', () => {
  it('finds p. N, page N, and CJK page forms', () => {
    const text = 'See p. 3 and page 12. 見第 7 頁。';
    expect(findPageCitations(text).map((c) => c.page)).toEqual([3, 12, 7]);
  });

  it('skips citations inside fenced code', () => {
    const text = 'Intro\n```\np. 9\n```\nThen p. 4';
    expect(findPageCitations(text).map((c) => c.page)).toEqual([4]);
  });
});

describe('injectPageCiteMarkup', () => {
  it('wraps citations for markdown-to-jsx', () => {
    expect(injectPageCiteMarkup('See p. 3.')).toBe(
      'See <pageref page="3">p. 3</pageref>.',
    );
  });
});
