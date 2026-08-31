export type LayoutItem = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Gutter = { x: number };

function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function layoutItemsFromTextContent(
  items: readonly unknown[],
  page: {
    width: number;
    height: number;
    convertToViewportPoint?: (x: number, y: number) => [number, number];
  },
): LayoutItem[] {
  const out: LayoutItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as {
      str?: string;
      transform?: number[];
      width?: number;
      height?: number;
    };
    if (typeof item.str !== 'string' || !item.str) continue;
    if (!Array.isArray(item.transform) || item.transform.length < 6) continue;
    const pdfX = item.transform[4]!;
    const pdfY = item.transform[5]!;
    let x = pdfX;
    let y = page.height - pdfY;
    if (page.convertToViewportPoint) {
      const vp = page.convertToViewportPoint(pdfX, pdfY);
      x = vp[0];
      y = vp[1];
    }
    out.push({
      str: item.str,
      x,
      y,
      width: typeof item.width === 'number' ? item.width : 0,
      height: typeof item.height === 'number' ? item.height : 10,
    });
  }
  return out;
}

function lineTolerance(items: LayoutItem[]): number {
  const heights = items
    .map((item) => item.height)
    .filter((h) => h > 0)
    .sort((a, b) => a - b);
  const mid = heights[Math.floor(heights.length / 2)] || 10;
  return Math.max(3, mid * 0.6);
}

export function linesFromItems(items: LayoutItem[]): string[] {
  if (items.length === 0) return [];
  const yTol = lineTolerance(items);
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Array<{ y: number; parts: LayoutItem[] }> = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(item.y - last.y) <= yTol) {
      last.parts.push(item);
      continue;
    }
    lines.push({ y: item.y, parts: [item] });
  }
  return lines
    .map((line) =>
      normalizeSpace(
        line.parts
          .sort((a, b) => a.x - b.x)
          .map((part) => part.str)
          .join(' '),
      ),
    )
    .filter(Boolean);
}

export function findColumnGutter(
  items: LayoutItem[],
  pageWidth: number,
): Gutter | null {
  if (items.length < 12 || pageWidth <= 0) return null;
  const buckets = 24;
  const counts = new Array<number>(buckets).fill(0);
  for (const item of items) {
    const cx = item.x + item.width / 2;
    const bucket = Math.min(
      buckets - 1,
      Math.max(0, Math.floor((cx / pageWidth) * buckets)),
    );
    counts[bucket] += 1;
  }
  const from = Math.floor(buckets * 0.35);
  const to = Math.ceil(buckets * 0.65);
  const emptyCap = Math.max(1, items.length * 0.03);
  const minSide = Math.max(6, items.length * 0.2);
  for (let i = from; i < to; i++) {
    let j = i;
    while (j < to && counts[j]! <= emptyCap) j += 1;
    if (j - i < 2) continue;
    const leftMass = counts.slice(0, i).reduce((a, b) => a + b, 0);
    const rightMass = counts.slice(j).reduce((a, b) => a + b, 0);
    if (leftMass >= minSide && rightMass >= minSide) {
      return { x: (((i + j) / 2) / buckets) * pageWidth };
    }
  }
  return null;
}

function isFullWidth(item: LayoutItem, pageWidth: number, gutter: Gutter): boolean {
  if (item.width >= pageWidth * 0.55) return true;
  const left = item.x;
  const right = item.x + item.width;
  return left < gutter.x - 8 && right > gutter.x + 8;
}

export function readingOrderText(
  items: LayoutItem[],
  pageWidth: number,
): string {
  const gutter = findColumnGutter(items, pageWidth);
  if (!gutter) return linesFromItems(items).join('\n');

  const full: LayoutItem[] = [];
  const left: LayoutItem[] = [];
  const right: LayoutItem[] = [];
  for (const item of items) {
    if (isFullWidth(item, pageWidth, gutter)) {
      full.push(item);
      continue;
    }
    if (item.x + item.width / 2 < gutter.x) left.push(item);
    else right.push(item);
  }

  const fullSorted = [...full].sort((a, b) => a.y - b.y);
  const cuts = [
    -Infinity,
    ...fullSorted.map((item) => item.y),
    Infinity,
  ];
  const chunks: string[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const from = cuts[i]!;
    const to = cuts[i + 1]!;
    const inBand = (item: LayoutItem) => item.y > from + 1 && item.y < to - 1;
    const leftText = linesFromItems(left.filter(inBand)).join('\n');
    const rightText = linesFromItems(right.filter(inBand)).join('\n');
    if (leftText) chunks.push(leftText);
    if (rightText) chunks.push(rightText);
    const heading = fullSorted[i];
    if (heading) chunks.push(normalizeSpace(heading.str));
  }
  return chunks.filter(Boolean).join('\n');
}

function bandKey(line: string): string {
  return normalizeSpace(line)
    .replace(/\d+/g, '#')
    .toLowerCase();
}

function isPageNumberLine(line: string): boolean {
  return /^\s*-?\d{1,4}\s*$/.test(line) || /^\s*page\s+\d{1,4}\s*$/i.test(line);
}

/** Drop short header/footer lines that repeat across pages, plus lone page numbers. */
export function stripRepeatedBands(pages: string[]): string[] {
  if (pages.length === 0) return pages;
  const lineLists = pages.map((text) =>
    text.split(/\r?\n/).filter((line) => line.trim()),
  );
  const counts = new Map<string, number>();
  const takeBands = (lines: string[]): string[] => {
    const out: string[] = [];
    for (const line of lines.slice(0, 2)) {
      if (line.length <= 80) out.push(line);
    }
    for (const line of lines.slice(-2)) {
      if (line.length <= 80) out.push(line);
    }
    return out;
  };
  if (pages.length >= 2) {
    for (const lines of lineLists) {
      const seen = new Set<string>();
      for (const line of takeBands(lines)) {
        const key = bandKey(line);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }
  const minRepeat = Math.max(2, Math.ceil(pages.length * 0.5));
  const drop = new Set(
    [...counts.entries()]
      .filter(([, n]) => n >= minRepeat)
      .map(([key]) => key),
  );

  return lineLists.map((lines) => {
    let start = 0;
    let end = lines.length;
    while (start < end && (drop.has(bandKey(lines[start]!)) || isPageNumberLine(lines[start]!))) {
      start += 1;
    }
    while (
      end > start &&
      (drop.has(bandKey(lines[end - 1]!)) || isPageNumberLine(lines[end - 1]!))
    ) {
      end -= 1;
    }
    return lines.slice(start, end).join('\n');
  });
}
