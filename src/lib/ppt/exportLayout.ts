import {
  LAYOUT_SPECS,
  PPT_CANVAS,
  gridTemplateForCount,
  type PptLayoutId,
} from './layouts';
import type { PptCard, PptPagePlan } from './types';

/** 16:9 slide in inches (PptxGenJS LAYOUT_16x9). Matches 1280×720. */
export const SLIDE_IN = { w: 10, h: 5.625 } as const;
export const PX_PER_INCH = PPT_CANVAS.width / SLIDE_IN.w;

export function pxToInch(px: number): number {
  return px / PX_PER_INCH;
}

export type InchBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CardBox = InchBox & {
  card: PptCard;
  index: number;
};

function parseTrackList(raw: string): number[] {
  const s = raw.trim();
  const repeat = /^repeat\(\s*(\d+)\s*,\s*([\d.]+)fr\s*\)$/i.exec(s);
  if (repeat) {
    const count = Number(repeat[1]);
    const fr = Number(repeat[2]);
    return Array.from({ length: count }, () => fr);
  }
  return s.split(/\s+/).map((tok) => {
    const m = /^([\d.]+)fr$/i.exec(tok);
    if (!m) throw new Error(`Unsupported grid track: ${tok}`);
    return Number(m[1]);
  });
}

export function parseCssGrid(template: string): {
  rows: number[];
  cols: number[];
} {
  const parts = template.split('/').map((p) => p.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Unsupported grid-template: ${template}`);
  }
  return { rows: parseTrackList(parts[0]), cols: parseTrackList(parts[1]) };
}

function distribute(
  tracks: number[],
  total: number,
  gap: number,
): Array<{ offset: number; size: number }> {
  const n = tracks.length;
  if (n === 0) return [];
  const available = Math.max(0, total - gap * Math.max(0, n - 1));
  const sum = tracks.reduce((a, b) => a + b, 0) || 1;
  let cursor = 0;
  return tracks.map((track) => {
    const size = (track / sum) * available;
    const cell = { offset: cursor, size };
    cursor += size + gap;
    return cell;
  });
}

function cardColSpan(
  layout: PptLayoutId,
  index: number,
  colCount: number,
): number {
  const slot = LAYOUT_SPECS[layout].slots[index];
  if (slot?.gridColumn === '1 / -1') return colCount;
  return 1;
}

function placeCards(
  layout: PptLayoutId,
  cardCount: number,
  rowCount: number,
  colCount: number,
): Array<{ row: number; col: number; rowSpan: number; colSpan: number }> {
  const occupied = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => false),
  );
  const placements: Array<{
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
  }> = [];

  const fits = (r: number, c: number, rs: number, cs: number) => {
    if (r + rs > rowCount || c + cs > colCount) return false;
    for (let y = r; y < r + rs; y++) {
      for (let x = c; x < c + cs; x++) {
        if (occupied[y]?.[x]) return false;
      }
    }
    return true;
  };

  const mark = (r: number, c: number, rs: number, cs: number) => {
    for (let y = r; y < r + rs; y++) {
      for (let x = c; x < c + cs; x++) {
        occupied[y]![x] = true;
      }
    }
  };

  for (let i = 0; i < cardCount; i++) {
    const colSpan = cardColSpan(layout, i, colCount);
    const rowSpan = 1;
    let placed = false;
    for (let r = 0; r < rowCount && !placed; r++) {
      for (let c = 0; c < colCount && !placed; c++) {
        if (!fits(r, c, rowSpan, colSpan)) continue;
        mark(r, c, rowSpan, colSpan);
        placements.push({ row: r, col: c, rowSpan, colSpan });
        placed = true;
      }
    }
    if (!placed) {
      placements.push({
        row: Math.min(rowCount - 1, i),
        col: 0,
        rowSpan: 1,
        colSpan: 1,
      });
    }
  }
  return placements;
}

export function contentAreaPx(hasTitleBar: boolean): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const pad = PPT_CANVAS.padding;
  const gap = PPT_CANVAS.gap;
  const title = hasTitleBar ? PPT_CANVAS.titleBar + gap : 0;
  return {
    x: pad,
    y: pad + title,
    w: PPT_CANVAS.width - pad * 2,
    h: PPT_CANVAS.height - pad * 2 - title,
  };
}

export function titleBarBox(): InchBox {
  return {
    x: pxToInch(PPT_CANVAS.padding),
    y: pxToInch(PPT_CANVAS.padding),
    w: pxToInch(PPT_CANVAS.width - PPT_CANVAS.padding * 2),
    h: pxToInch(PPT_CANVAS.titleBar),
  };
}

export function cardBoxesForPlan(plan: PptPagePlan): CardBox[] {
  const spec = LAYOUT_SPECS[plan.layout];
  const template = gridTemplateForCount(plan.layout, plan.cards.length);
  const { rows, cols } = parseCssGrid(template);
  const area = contentAreaPx(spec.hasTitleBar);
  const rowCells = distribute(rows, area.h, PPT_CANVAS.gap);
  const colCells = distribute(cols, area.w, PPT_CANVAS.gap);
  const places = placeCards(
    plan.layout,
    plan.cards.length,
    rows.length,
    cols.length,
  );

  return plan.cards.map((card, i) => {
    const place = places[i] ?? {
      row: 0,
      col: 0,
      rowSpan: 1,
      colSpan: 1,
    };
    const x0 = colCells[place.col]?.offset ?? 0;
    const y0 = rowCells[place.row]?.offset ?? 0;
    const x1 =
      (colCells[place.col + place.colSpan - 1]?.offset ?? x0) +
      (colCells[place.col + place.colSpan - 1]?.size ?? 0);
    const y1 =
      (rowCells[place.row + place.rowSpan - 1]?.offset ?? y0) +
      (rowCells[place.row + place.rowSpan - 1]?.size ?? 0);
    return {
      card,
      index: i,
      x: pxToInch(area.x + x0),
      y: pxToInch(area.y + y0),
      w: pxToInch(Math.max(1, x1 - x0)),
      h: pxToInch(Math.max(1, y1 - y0)),
    };
  });
}
