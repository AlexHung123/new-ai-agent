'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, Highlighter, MessageSquare } from 'lucide-react';
import { getAuthBearerHeaders } from '@/lib/utils/auth';
import { collectTextSpans } from '@/lib/reading/collectTextSpans';
import {
  quoteRectsInSpans,
  type HighlightRect,
} from '@/lib/reading/textLayerHighlight';
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
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(480);
  const [numPages, setNumPages] = useState(0);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, Math.floor(el.clientWidth - 24)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMenu(null);
    setError(null);
    setPdfUrl(null);
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

  const refreshOverlays = useCallback(() => {
    const pageEl = pageRef.current;
    if (!pageEl) {
      setOverlays([]);
      return;
    }
    const spans = collectTextSpans(pageEl);
    const next: Overlay[] = [];
    for (const mark of marks) {
      if (mark.page !== page) continue;
      const rects = quoteRectsInSpans(spans, mark.quote);
      for (const rect of rects) {
        next.push({
          ...rect,
          id: mark.id,
          kind: mark.kind,
          active: mark.id === activeMarkId,
        });
      }
    }
    setOverlays(next);
  }, [marks, page, activeMarkId]);

  useEffect(() => {
    const id = window.requestAnimationFrame(refreshOverlays);
    return () => window.cancelAnimationFrame(id);
  }, [refreshOverlays, width]);

  useEffect(() => {
    if (!activeMarkId) return;
    const node = pageRef.current?.querySelector(`[data-mark-id="${activeMarkId}"]`);
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

  const selectionFromMenu = (): ReaderSelection | null => {
    if (!menu) return null;
    return { quote: menu.text, page: menu.page };
  };

  return (
    <div ref={hostRef} className="reader-pdf">
      <div className="reader-pdf-scroll">
        {error ? (
          <p className="reader-pdf-status">{error}</p>
        ) : !pdfUrl ? (
          <p className="reader-pdf-status">Loading PDF…</p>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={(info) => {
              setNumPages(info.numPages);
              onPageChange(Math.min(Math.max(page, 1), info.numPages) || 1);
            }}
            onLoadError={() => setError('Could not open this PDF.')}
            loading={<p className="reader-pdf-status">Loading PDF…</p>}
            error={<p className="reader-pdf-status">Could not open this PDF.</p>}
          >
            <div ref={pageRef} className="reader-pdf-page">
              <Page
                pageNumber={Math.min(Math.max(page, 1), numPages || 1)}
                width={width}
                renderAnnotationLayer
                renderTextLayer
                onRenderTextLayerSuccess={refreshOverlays}
              />
              {overlays.map((overlay, i) => (
                <div
                  key={`${overlay.id}-${i}`}
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
          </Document>
        )}
      </div>
      <div className="reader-pdf-bar">
        <button
          type="button"
          className="reader-page-btn"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="reader-page-label">
          {page} / {numPages || '—'}
        </span>
        <button
          type="button"
          className="reader-page-btn"
          aria-label="Next page"
          disabled={!numPages || page >= numPages}
          onClick={() => onPageChange(Math.min(numPages, page + 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
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
