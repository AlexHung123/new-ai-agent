import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type OutlineEntry } from './outline';
import {
  layoutItemsFromTextContent,
  readingOrderText,
  stripRepeatedBands,
} from './readingOrder';

export type { OutlineEntry } from './outline';
export { formatOutlineMarkdown } from './outline';

export type ExtractedPdfPage = {
  page: number;
  text: string;
};

export type PdfExtractOk = {
  ok: true;
  paged: boolean;
  pageCount: number;
  pages: ExtractedPdfPage[];
  outline?: OutlineEntry[];
};

export type PdfExtractFail = {
  ok: false;
  error: string;
};

export type PdfExtractResult = PdfExtractOk | PdfExtractFail;

export function pageMarkerComment(page: number): string {
  return `<!-- page: ${page} -->`;
}

export function formatPageMarkdown(page: number, text: string): string {
  const body = text.trim() || '(No extractable text on this page.)';
  return `${pageMarkerComment(page)}\n\n# Page ${page}\n\n${body}\n`;
}

export function ensurePageMarker(markdown: string, page: number): string {
  const marker = pageMarkerComment(page);
  if (markdown.includes(marker)) return markdown;
  return `${marker}\n\n${markdown.trimStart()}`;
}

/** Rebuild page text from pdf.js getTextContent items (top-to-bottom, columns). */
export function textContentToString(
  items: readonly unknown[],
  page?: { width: number; height: number },
): string {
  let width = page?.width ?? 0;
  let height = page?.height ?? 0;
  if (!width || !height) {
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as { transform?: number[]; width?: number };
      if (!Array.isArray(item.transform) || item.transform.length < 6) continue;
      width = Math.max(width, item.transform[4]! + (item.width || 0));
      height = Math.max(height, item.transform[5]!);
    }
    width = Math.max(width, 1);
    height = Math.max(height, 1);
  }
  const layout = layoutItemsFromTextContent(items, { width, height });
  return readingOrderText(layout, width);
}

function ensurePdfjsDomPolyfills() {
  const g = globalThis as typeof globalThis & {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
  };
  if (typeof g.DOMMatrix === 'undefined') {
    g.DOMMatrix = class DOMMatrix {};
  }
  if (typeof g.ImageData === 'undefined') {
    g.ImageData = class ImageData {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      constructor(width = 1, height = 1) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    };
  }
  if (typeof g.Path2D === 'undefined') {
    g.Path2D = class Path2D {};
  }
}

function pdfjsFileUrl(...parts: string[]): string {
  return pathToFileURL(
    join(process.cwd(), 'node_modules', 'pdfjs-dist', ...parts),
  ).href;
}

function pdfjsDirUrl(...parts: string[]): string {
  const href = pdfjsFileUrl(...parts);
  return href.endsWith('/') ? href : `${href}/`;
}

type OutlinePdf = {
  getOutline?: () => Promise<
    | Array<{
        title?: string;
        dest?: unknown;
        items?: unknown[];
      }>
    | null
  >;
  getDestination?: (name: string) => Promise<unknown>;
  getPageIndex?: (ref: unknown) => Promise<number>;
};

async function destToPage(
  pdf: OutlinePdf,
  dest: unknown,
): Promise<number | null> {
  if (!dest || !pdf.getPageIndex) return null;
  try {
    let explicit = dest;
    if (typeof dest === 'string' && pdf.getDestination) {
      explicit = await pdf.getDestination(dest);
    }
    if (!Array.isArray(explicit) || explicit[0] == null) return null;
    const index = await pdf.getPageIndex(explicit[0]);
    if (!Number.isFinite(index) || index < 0) return null;
    return Math.floor(index) + 1;
  } catch {
    return null;
  }
}

async function walkOutline(
  pdf: OutlinePdf,
  nodes: unknown[] | undefined,
): Promise<OutlineEntry[]> {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  const out: OutlineEntry[] = [];
  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object') continue;
    const node = raw as {
      title?: string;
      dest?: unknown;
      items?: unknown[];
    };
    const title = String(node.title || '').replace(/\s+/g, ' ').trim();
    if (!title && (!node.items || node.items.length === 0)) continue;
    out.push({
      title: title || 'Untitled',
      page: await destToPage(pdf, node.dest),
      items: await walkOutline(pdf, node.items),
    });
  }
  return out;
}

async function loadOutline(pdf: OutlinePdf): Promise<OutlineEntry[]> {
  if (!pdf.getOutline) return [];
  try {
    const raw = await pdf.getOutline();
    return walkOutline(pdf, raw || []);
  } catch {
    return [];
  }
}

export async function extractPdfPages(
  bytes: Uint8Array,
): Promise<PdfExtractResult> {
  if (bytes.byteLength === 0) {
    return { ok: false, error: 'This file is empty.' };
  }

  try {
    ensurePdfjsDomPolyfills();
    type PdfDoc = {
      numPages: number;
      getPage: (n: number) => Promise<{
        getViewport: (opts: { scale: number }) => {
          width: number;
          height: number;
          convertToViewportPoint: (x: number, y: number) => [number, number];
        };
        getTextContent: (opts?: {
          includeMarkedContent?: boolean;
        }) => Promise<{ items: unknown[] }>;
        cleanup: () => void;
      }>;
      getOutline?: () => Promise<
        | Array<{
            title?: string;
            dest?: unknown;
            items?: unknown[];
          }>
        | null
      >;
      getDestination?: (name: string) => Promise<unknown>;
      getPageIndex?: (ref: unknown) => Promise<number>;
      destroy: () => Promise<void>;
    };
    const loaded = (await import(
      pdfjsFileUrl('legacy', 'build', 'pdf.mjs')
    )) as {
      default?: unknown;
      GlobalWorkerOptions?: { workerSrc: string };
      getDocument?: (opts: Record<string, unknown>) => {
        promise: Promise<PdfDoc>;
      };
    };
    const pdfjs = (
      loaded.getDocument ? loaded : loaded.default
    ) as {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (opts: Record<string, unknown>) => {
        promise: Promise<PdfDoc>;
      };
    };
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsFileUrl(
      'legacy',
      'build',
      'pdf.worker.mjs',
    );

    const data = Uint8Array.from(bytes);
    const loadingTask = pdfjs.getDocument({
      data,
      disableAutoFetch: true,
      disableStream: true,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
      standardFontDataUrl: pdfjsDirUrl('standard_fonts'),
    });

    const pdf = await loadingTask.promise;
    try {
      const pageCount = pdf.numPages;
      if (!pageCount || pageCount < 1) {
        return { ok: false, error: 'Could not extract text from this file.' };
      }
      const pages: ExtractedPdfPage[] = [];
      for (let page = 1; page <= pageCount; page++) {
        const pdfPage = await pdf.getPage(page);
        try {
          const viewport = pdfPage.getViewport({ scale: 1 });
          const content = await pdfPage.getTextContent({
            includeMarkedContent: false,
          });
          const layout = layoutItemsFromTextContent(content.items, {
            width: viewport.width,
            height: viewport.height,
            convertToViewportPoint: (x, y) =>
              viewport.convertToViewportPoint(x, y),
          });
          pages.push({
            page,
            text: readingOrderText(layout, viewport.width),
          });
        } finally {
          pdfPage.cleanup();
        }
      }
      const stripped = stripRepeatedBands(pages.map((item) => item.text));
      const cleaned = pages.map((item, i) => ({
        ...item,
        text: stripped[i] || '',
      }));
      const hasText = cleaned.some((item) => item.text.trim());
      if (!hasText) {
        return {
          ok: false,
          error: 'Could not extract text from this file.',
        };
      }
      const outline = await loadOutline(pdf);
      return {
        ok: true,
        paged: true,
        pageCount,
        pages: cleaned,
        outline: outline.length > 0 ? outline : undefined,
      };
    } finally {
      await pdf.destroy();
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Could not extract text from this file.';
    return { ok: false, error: message };
  }
}
