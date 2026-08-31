export type TextSpanBox = {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HighlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function normalizeQuote(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizedIndexMap(text: string): { normalized: string; map: number[] } {
  const map: number[] = [];
  let normalized = '';
  let lastWasSpace = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (/\s/.test(ch)) {
      if (!lastWasSpace && normalized.length > 0) {
        map.push(i);
        normalized += ' ';
        lastWasSpace = true;
      }
      continue;
    }
    map.push(i);
    normalized += ch;
    lastWasSpace = false;
  }
  return { normalized: normalized.trimEnd(), map };
}

function spanRanges(spans: TextSpanBox[]): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let offset = 0;
  for (const span of spans) {
    const len = span.text.length;
    ranges.push({ start: offset, end: offset + len });
    offset += len;
  }
  return ranges;
}

function mergeRects(rects: HighlightRect[]): HighlightRect[] {
  if (rects.length === 0) return [];
  const sorted = [...rects].sort((a, b) => a.top - b.top || a.left - b.left);
  const out: HighlightRect[] = [];
  for (const rect of sorted) {
    const prev = out[out.length - 1];
    if (
      prev &&
      Math.abs(prev.top - rect.top) <= Math.max(2, prev.height * 0.35) &&
      rect.left <= prev.left + prev.width + 2
    ) {
      const right = Math.max(prev.left + prev.width, rect.left + rect.width);
      const bottom = Math.max(prev.top + prev.height, rect.top + rect.height);
      prev.left = Math.min(prev.left, rect.left);
      prev.top = Math.min(prev.top, rect.top);
      prev.width = right - prev.left;
      prev.height = bottom - prev.top;
      continue;
    }
    out.push({ ...rect });
  }
  return out;
}

/** Overlay rects for the first occurrence of `quote` in page text-layer spans. */
export function quoteRectsInSpans(
  spans: TextSpanBox[],
  quote: string,
): HighlightRect[] {
  const needle = normalizeQuote(quote);
  if (!needle || spans.length === 0) return [];

  const haystack = spans.map((span) => span.text).join('');
  const { normalized, map } = normalizedIndexMap(haystack);
  const startNorm = normalized.indexOf(needle);
  if (startNorm < 0) return [];
  const endNorm = startNorm + needle.length;
  const origStart = map[startNorm];
  const origEnd = map[endNorm - 1];
  if (origStart == null || origEnd == null) return [];

  const ranges = spanRanges(spans);
  const rects: HighlightRect[] = [];
  for (let i = 0; i < spans.length; i++) {
    const range = ranges[i]!;
    if (range.end <= origStart || range.start > origEnd) continue;
    const span = spans[i]!;
    if (span.width <= 0 || span.height <= 0) continue;
    rects.push({
      left: span.left,
      top: span.top,
      width: span.width,
      height: span.height,
    });
  }
  return mergeRects(rects);
}
