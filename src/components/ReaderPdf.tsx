'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Highlighter, MessageSquare } from 'lucide-react';
import { getAuthBearerHeaders } from '@/lib/utils/auth';
import { collectTextSpans } from '@/lib/reading/collectTextSpans';
import {
  quoteRectsInSpans,
  type HighlightRect,
} from '@/lib/reading/textLayerHighlight';
import {
  destinationPageNumber,
  estimatePdfPageHeight,
  leadingVisiblePage,
  pagesToRender,
} from '@/lib/reading/pageWindow';
import type { ReaderMark, ReaderSelection } from '@/lib/reading/types';

pdfjs.GlobalWorkerOptions.workerSrc = '/itms/ai/pdf.worker.min.mjs';

type MenuState = {
  x: number;
  y: number;
  text: string;
  page: number;
};

type Overlay = HighlightRect & {
  id: string;
  kind: ReaderMark['kind'];
  active: boolean;
  page: number;
};

const ReaderPdf = ({
  fileId,
  page,
  marks,
  activeMarkId,
  onPageChange,
  onAsk,
  onHighlight,
  onSelection,
}: {
  fileId: string;
  page: number;
  marks: ReaderMark[];
  activeMarkId?: string | null;
  onPageChange: (page: number) => void;
  onAsk: (selection: ReaderSelection) => void;
  onHighlight: (selection: ReaderSelection) => void;
  onSelection: (selection: ReaderSelection | null) => void;
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());
  const skipScrollRef = useRef(false);
  const numPagesRef = useRef(0);
  const onPageChangeRef = useRef(onPageChange);
  const [width, setWidth] = useState(480);
  const [pageHeight, setPageHeight] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);

  numPagesRef.current = numPages;
  onPageChangeRef.current = onPageChange;

  const rendered = useMemo(
    () => new Set(pagesToRender(numPages, visiblePages, page)),
    [numPages, visiblePages, page],
  );
  const slotHeight = pageHeight || estimatePdfPageHeight(width);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () =>
      setWidth(Math.max(280, Math.floor(el.clientWidth - 24)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMenu(null);
    setError(null);
    setPdfUrl(null);
    setNumPages(0);
    setVisiblePages(new Set());
    setPageHeight(0);
    setOverlays([]);
    pageRefs.current.clear();
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/itms/ai/api/reading/files/${encodeURIComponent(fileId)}/pdf`,
          { headers: getAuthBearerHeaders() },
        );
        if (!res.ok) {
          if (!cancelled) setError('Could not open this PDF.');
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch {
        if (!cancelled) setError('Could not open this PDF.');
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || numPages < 1) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          let changed = false;
          const next = new Set(prev);
          for (const entry of entries) {
            const n = Number((entry.target as HTMLElement).dataset.page);
            if (!Number.isFinite(n) || n < 1) continue;
            if (entry.isIntersecting) {
              if (!next.has(n)) {
                next.add(n);
                changed = true;
              }
            } else if (next.has(n)) {
              next.delete(n);
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      },
      { root, rootMargin: '800px 0px', threshold: 0.01 },
    );
    for (const el of pageRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [numPages, pdfUrl]);

  const reportVisiblePage = useCallback(() => {
    const root = scrollRef.current;
    if (!root || numPages < 1) return;
    const viewportTop = root.getBoundingClientRect().top + 12;
    const tops: Array<{ page: number; top: number }> = [];
    for (const [n, el] of pageRefs.current) {
      tops.push({ page: n, top: el.getBoundingClientRect().top });
    }
    const next = leadingVisiblePage(tops, viewportTop);
    if (!next || next === page) return;
    skipScrollRef.current = true;
    onPageChange(next);
  }, [numPages, onPageChange, page]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        reportVisiblePage();
      });
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reportVisiblePage]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    const el = pageRefs.current.get(page);
    if (!el) return;
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [page, numPages, pdfUrl]);

  const refreshOverlays = useCallback(() => {
    const next: Overlay[] = [];
    for (const mark of marks) {
      const pageEl = pageRefs.current.get(mark.page);
      if (!pageEl) continue;
      const rects = quoteRectsInSpans(collectTextSpans(pageEl), mark.quote);
      for (const rect of rects) {
        next.push({
          ...rect,
          id: mark.id,
          kind: mark.kind,
          active: mark.id === activeMarkId,
          page: mark.page,
        });
      }
    }
    setOverlays(next);
  }, [marks, activeMarkId]);

  useEffect(() => {
    const id = window.requestAnimationFrame(refreshOverlays);
    return () => window.cancelAnimationFrame(id);
  }, [refreshOverlays, width, rendered]);

  useEffect(() => {
    if (!activeMarkId) return;
    const node = scrollRef.current?.querySelector(
      `[data-mark-id="${activeMarkId}"]`,
    );
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [overlays, activeMarkId]);

  useEffect(() => {
    const onUp = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.reader-sel-menu')) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setMenu(null);
        return;
      }
      const text = sel.toString().replace(/\s+/g, ' ').trim();
      if (!text) {
        setMenu(null);
        return;
      }
      const node = sel.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      const pageEl = el?.closest('.react-pdf__Page');
      if (!pageEl || !hostRef.current?.contains(pageEl)) {
        setMenu(null);
        return;
      }
      const pageNumber = Number(
        pageEl.getAttribute('data-page-number') || page,
      );
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const selection = {
        quote: text,
        page: Number.isFinite(pageNumber) ? pageNumber : page,
      };
      setMenu({
        x: rect.left + rect.width / 2,
        y: Math.max(8, rect.top - 8),
        text,
        page: selection.page,
      });
      onSelection(selection);
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, [page, onSelection]);

  const goToPage = useCallback(
    ({
      pageNumber,
      pageIndex,
    }: {
      pageNumber?: number;
      pageIndex?: number;
    }) => {
      const next = destinationPageNumber(
        { pageNumber, pageIndex },
        numPagesRef.current,
      );
      if (next) onPageChangeRef.current(next);
    },
    [],
  );

  const selectionFromMenu = (): ReaderSelection | null => {
    if (!menu) return null;
    return { quote: menu.text, page: menu.page };
  };

  return (
    <div ref={hostRef} className="reader-pdf">
      <div ref={scrollRef} className="reader-pdf-scroll">
        {error ? (
          <p className="reader-pdf-status">{error}</p>
        ) : !pdfUrl ? (
          <p className="reader-pdf-status">Loading PDF…</p>
        ) : (
          <Document
            className="reader-pdf-doc"
            file={pdfUrl}
            onItemClick={goToPage}
            onLoadSuccess={(info) => {
              setNumPages(info.numPages);
              onPageChange(
                Math.min(Math.max(page, 1), info.numPages) || 1,
              );
            }}
            onLoadError={() => setError('Could not open this PDF.')}
            loading={<p className="reader-pdf-status">Loading PDF…</p>}
            error={<p className="reader-pdf-status">Could not open this PDF.</p>}
          >
            {Array.from({ length: numPages }, (_, i) => {
              const pageNumber = i + 1;
              const pageOverlays = overlays.filter(
                (overlay) => overlay.page === pageNumber,
              );
              return (
                <div
                  key={pageNumber}
                  data-page={pageNumber}
                  ref={(el) => {
                    if (el) pageRefs.current.set(pageNumber, el);
                    else pageRefs.current.delete(pageNumber);
                  }}
                  className="reader-pdf-page"
                  style={{ minHeight: slotHeight }}
                >
                  {rendered.has(pageNumber) ? (
                    <Page
                      pageNumber={pageNumber}
                      width={width}
                      renderAnnotationLayer
                      renderTextLayer
                      onRenderSuccess={() => {
                        const el = pageRefs.current.get(pageNumber);
                        const h = el?.getBoundingClientRect().height || 0;
                        if (h > 0) {
                          setPageHeight((prev) => (prev === h ? prev : h));
                        }
                        refreshOverlays();
                      }}
                      onRenderTextLayerSuccess={refreshOverlays}
                    />
                  ) : null}
                  {pageOverlays.map((overlay, overlayIndex) => (
                    <div
                      key={`${overlay.id}-${overlayIndex}`}
                      data-mark-id={overlay.id}
                      className={`reader-hl${overlay.kind === 'ask' ? ' is-ask' : ''}${overlay.active ? ' is-active' : ''}`}
                      style={{
                        left: overlay.left,
                        top: overlay.top,
                        width: overlay.width,
                        height: overlay.height,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </Document>
        )}
      </div>
      {numPages > 0 ? (
        <div className="reader-pdf-page-indicator" aria-live="polite">
          {page} / {numPages}
        </div>
      ) : null}
      {menu ? (
        <div className="reader-sel-menu" style={{ left: menu.x, top: menu.y }}>
          <button
            type="button"
            onClick={() => {
              const sel = selectionFromMenu();
              if (sel) onHighlight(sel);
              setMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <Highlighter size={14} />
            Highlight
          </button>
          <button
            type="button"
            onClick={() => {
              const sel = selectionFromMenu();
              if (sel) onAsk(sel);
              setMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <MessageSquare size={14} />
            Ask
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ReaderPdf;
