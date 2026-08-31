import { describe, expect, it } from 'vitest';
import {
  ensurePageMarker,
  formatPageMarkdown,
  pageMarkerComment,
  textContentToString,
} from './extractPdfPages';

describe('textContentToString', () => {
  it('joins same-line items and breaks on y jumps or hasEOL', () => {
    const text = textContentToString([
      { str: 'Hello', transform: [1, 0, 0, 1, 0, 700], hasEOL: false },
      { str: 'world', transform: [1, 0, 0, 1, 40, 700], hasEOL: true },
      { str: 'Next', transform: [1, 0, 0, 1, 0, 680], hasEOL: false },
    ]);
    expect(text).toBe('Hello world\nNext');
  });

  it('skips marked-content objects', () => {
    expect(textContentToString([{ type: 'beginMarkedContent' }, { str: 'Hi' }])).toBe(
      'Hi',
    );
  });
});

describe('formatPageMarkdown', () => {
  it('stamps a page comment and heading', () => {
    const md = formatPageMarkdown(3, 'Clause 2');
    expect(md).toContain(pageMarkerComment(3));
    expect(md).toContain('# Page 3');
    expect(md).toContain('Clause 2');
  });

  it('keeps empty pages so numbers stay aligned', () => {
    expect(formatPageMarkdown(2, '  ')).toContain(
      '(No extractable text on this page.)',
    );
  });
});

describe('ensurePageMarker', () => {
  it('prepends a missing marker after a split', () => {
    expect(ensurePageMarker('more text', 4)).toBe(
      `${pageMarkerComment(4)}\n\nmore text`,
    );
  });
});
