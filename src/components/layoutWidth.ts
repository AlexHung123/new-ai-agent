export type LayoutKind = 'narrow' | 'wide' | 'reader';

export const WIDE_LAYOUT_CLASS = 'mx-2 max-w-[100rem] md:mx-4 lg:mx-auto';
export const NARROW_LAYOUT_CLASS = 'mx-4 max-w-screen-lg lg:mx-auto';
export const READER_LAYOUT_CLASS = 'ml-0 mr-2 w-full max-w-none';

export function layoutContentClassName(kind: LayoutKind): string {
  if (kind === 'reader') return READER_LAYOUT_CLASS;
  if (kind === 'wide') return WIDE_LAYOUT_CLASS;
  return NARROW_LAYOUT_CLASS;
}

/** URL segments can drive SSR; focusMode is restored from localStorage. */
export function layoutKind(
  segments: readonly string[],
  focusMode: string,
  hydrated: boolean,
): LayoutKind {
  if (hydrated && focusMode === 'agentReader') return 'reader';
  if (segments.includes('agents')) return 'wide';
  return 'narrow';
}

export function shouldUseWideLayout(
  segments: readonly string[],
  focusMode: string,
  hydrated: boolean,
): boolean {
  return layoutKind(segments, focusMode, hydrated) !== 'narrow';
}
