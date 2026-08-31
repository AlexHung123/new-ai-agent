import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export type ExtractedPdfPage = {
  page: number;
  text: string;
};

export type PdfExtractOk = {
  ok: true;
  paged: boolean;
  pageCount: number;
  pages: ExtractedPdfPage[];
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

type TextContentItem = {
  str?: string;
  transform?: number[];
  hasEOL?: boolean;
};

/** Rebuild page text from pdf.js getTextContent items. */
export function textContentToString(items: readonly unknown[]): string {
  let line = '';
  const lines: string[] = [];
  let lastY: number | null = null;

  const flush = () => {
    const trimmed = line.trimEnd();
    if (trimmed) lines.push(trimmed);
    line = '';
    lastY = null;
  };

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as TextContentItem;
    if (typeof item.str !== 'string') continue;
    const y =
      Array.isArray(item.transform) && typeof item.transform[5] === 'number'
        ? item.transform[5]
        : null;
    if (lastY != null && y != null && Math.abs(y - lastY) > 3) {
      flush();
    }
    if (line && !line.endsWith(' ') && item.str && !item.str.startsWith(' ')) {
      line += ' ';
    }
    line += item.str;
    if (item.hasEOL) {
      flush();
      continue;
    }
    if (y != null) lastY = y;
  }
  flush();
  return lines.join('\n').trim();
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

export async function extractPdfPages(
  bytes: Uint8Array,
): Promise<PdfExtractResult> {
  if (bytes.byteLength === 0) {
    return { ok: false, error: 'This file is empty.' };
  }

  try {
    ensurePdfjsDomPolyfills();
    const loaded = (await import(
      pdfjsFileUrl('legacy', 'build', 'pdf.mjs')
    )) as {
      default?: unknown;
      GlobalWorkerOptions?: { workerSrc: string };
      getDocument?: (opts: Record<string, unknown>) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<{
            getTextContent: (opts?: {
              includeMarkedContent?: boolean;
            }) => Promise<{ items: unknown[] }>;
            cleanup: () => void;
          }>;
          destroy: () => Promise<void>;
        }>;
      };
    };
    const pdfjs = (
      loaded.getDocument ? loaded : loaded.default
    ) as {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (opts: Record<string, unknown>) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<{
            getTextContent: (opts?: {
              includeMarkedContent?: boolean;
            }) => Promise<{ items: unknown[] }>;
            cleanup: () => void;
          }>;
          destroy: () => Promise<void>;
        }>;
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
          const content = await pdfPage.getTextContent({
            includeMarkedContent: false,
          });
          pages.push({
            page,
            text: textContentToString(content.items),
          });
        } finally {
          pdfPage.cleanup();
        }
      }
      const hasText = pages.some((item) => item.text.trim());
      if (!hasText) {
        return {
          ok: false,
          error: 'Could not extract text from this file.',
        };
      }
      return { ok: true, paged: true, pageCount, pages };
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
