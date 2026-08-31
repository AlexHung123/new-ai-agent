import type { TextSpanBox } from './textLayerHighlight';

export function collectTextSpans(pageEl: HTMLElement): TextSpanBox[] {
  const layer =
    pageEl.querySelector<HTMLElement>('.react-pdf__Page__textContent') ||
    pageEl.querySelector<HTMLElement>('.textLayer');
  if (!layer) return [];
  const pageRect = pageEl.getBoundingClientRect();
  return Array.from(layer.querySelectorAll('span')).map((node) => {
    const r = node.getBoundingClientRect();
    return {
      text: node.textContent || '',
      left: r.left - pageRect.left,
      top: r.top - pageRect.top,
      width: r.width,
      height: r.height,
    };
  });
}
