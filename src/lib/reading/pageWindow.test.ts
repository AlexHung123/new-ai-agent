import { describe, expect, it } from 'vitest';
import {
  destinationPageNumber,
  estimatePdfPageHeight,
  leadingVisiblePage,
  pagesToRender,
} from './pageWindow';

describe('pagesToRender', () => {
  it('returns no pages before the document reports a length', () => {
    expect(pagesToRender(0, [1], 1)).toEqual([]);
  });

  it('keeps a buffer around the focused page for long-document scrolling', () => {
    expect(pagesToRender(147, [], 2, 2)).toEqual([1, 2, 3, 4]);
    expect(pagesToRender(147, [], 147, 2)).toEqual([145, 146, 147]);
  });

  it('also mounts pages currently in the scroll viewport', () => {
    expect(pagesToRender(20, [10], 1, 1)).toEqual([1, 2, 9, 10, 11]);
  });
});

describe('leadingVisiblePage', () => {
  it('picks the page whose top is closest to the pane top', () => {
    expect(
      leadingVisiblePage(
        [
          { page: 2, top: 80 },
          { page: 3, top: 12 },
          { page: 4, top: 400 },
        ],
        0,
      ),
    ).toBe(3);
  });

  it('returns null when no page slots are measured', () => {
    expect(leadingVisiblePage([], 0)).toBeNull();
  });
});

describe('destinationPageNumber', () => {
  it('uses the 1-based page number from an internal PDF link', () => {
    expect(destinationPageNumber({ pageNumber: 43, pageIndex: 42 }, 147)).toBe(
      43,
    );
  });

  it('falls back to pageIndex + 1 when pageNumber is missing', () => {
    expect(destinationPageNumber({ pageIndex: 42 }, 147)).toBe(43);
  });

  it('clamps to the document and ignores invalid targets', () => {
    expect(destinationPageNumber({ pageNumber: 0, pageIndex: -1 }, 10)).toBe(
      null,
    );
    expect(destinationPageNumber({ pageNumber: 200 }, 147)).toBe(147);
    expect(destinationPageNumber({ pageNumber: 43 }, 0)).toBe(null);
  });
});

describe('estimatePdfPageHeight', () => {
  it('uses a letter-page aspect so unloaded slots still form a long canvas', () => {
    expect(estimatePdfPageHeight(400)).toBe(Math.round(400 * (11 / 8.5)));
  });
});
