export const PAGE_RENDER_BUFFER = 2;
export const PAGE_ASPECT = 11 / 8.5;

export function estimatePdfPageHeight(width: number): number {
  return Math.max(1, Math.round(width * PAGE_ASPECT));
}

export function pagesToRender(
  numPages: number,
  visiblePages: Iterable<number>,
  focusPage: number,
  buffer = PAGE_RENDER_BUFFER,
): number[] {
  if (numPages < 1) return [];
  const out = new Set<number>();
  const add = (center: number) => {
    if (!Number.isFinite(center)) return;
    const c = Math.min(numPages, Math.max(1, Math.floor(center)));
    const start = Math.max(1, c - buffer);
    const end = Math.min(numPages, c + buffer);
    for (let p = start; p <= end; p++) out.add(p);
  };
  add(focusPage);
  for (const p of visiblePages) add(p);
  return [...out].sort((a, b) => a - b);
}

export function destinationPageNumber(
  args: { pageNumber?: number; pageIndex?: number },
  numPages: number,
): number | null {
  if (numPages < 1) return null;
  const fromNumber =
    Number.isFinite(args.pageNumber) && (args.pageNumber as number) >= 1
      ? Math.floor(args.pageNumber as number)
      : NaN;
  const fromIndex =
    Number.isFinite(args.pageIndex) && (args.pageIndex as number) >= 0
      ? Math.floor(args.pageIndex as number) + 1
      : NaN;
  const raw = Number.isFinite(fromNumber) ? fromNumber : fromIndex;
  if (!Number.isFinite(raw)) return null;
  return Math.min(numPages, Math.max(1, raw));
}

export function leadingVisiblePage(
  pageTops: Array<{ page: number; top: number }>,
  viewportTop: number,
): number | null {
  if (pageTops.length === 0) return null;
  let best = pageTops[0]!;
  let bestDist = Math.abs(best.top - viewportTop);
  for (const item of pageTops) {
    const dist = Math.abs(item.top - viewportTop);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best.page;
}
