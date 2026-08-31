'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useChat } from '@/lib/hooks/useChat';
import type { ReaderMark, ReaderSelection } from '@/lib/reading/types';
import { getAuthHeaders } from '@/lib/utils/auth';

const ReaderPdf = dynamic(() => import('./ReaderPdf'), { ssr: false });

const ReaderPane = () => {
  const {
    documentId,
    readingFiles,
    setDocumentId,
    messages,
    sendMessage,
    setReaderSelection,
    readerPage,
    setReaderPage,
  } = useChat();
  const [marks, setMarks] = useState<ReaderMark[]>([]);
  const [activeMarkId, setActiveMarkId] = useState<string | null>(null);
  const file = readingFiles.find((item) => item.fileId === documentId);
  const canChange = messages.length === 0;

  useEffect(() => {
    setActiveMarkId(null);
  }, [documentId]);

  useEffect(() => {
    if (!documentId) {
      setMarks([]);
      return;
    }
    let cancelled = false;
    fetch(`/itms/ai/api/reading/files/${encodeURIComponent(documentId)}/marks`, {
      headers: getAuthHeaders(),
    })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (!cancelled) setMarks(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setMarks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const postMark = async (
    kind: 'highlight' | 'ask',
    selection: ReaderSelection,
    question?: string,
  ) => {
    if (!documentId) return;
    try {
      const res = await fetch(
        `/itms/ai/api/reading/files/${encodeURIComponent(documentId)}/marks`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kind,
            page: selection.page,
            quote: selection.quote,
            question,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || 'Could not save mark');
        return;
      }
      if (data.item) {
        setMarks((prev) => [...prev, data.item]);
        setActiveMarkId(data.item.id);
      }
    } catch {
      toast.error('Could not save mark');
    }
  };

  const onHighlight = (selection: ReaderSelection) => {
    const named = { ...selection, fileName: file?.name };
    setReaderSelection(named);
    void postMark('highlight', named);
  };

  const onAsk = (selection: ReaderSelection) => {
    const named = { ...selection, fileName: file?.name };
    setReaderSelection(named);
    void postMark('ask', named, 'Explain this passage.');
    void sendMessage('Explain this passage.');
  };

  if (!documentId) return null;

  return (
    <aside className="reader-pane">
      <header className="reader-pane-header">
        <div>
          <h2>{file?.name || 'PDF'}</h2>
          {file?.status === 'failed' ? (
            <p>Text extraction failed. You can still quote from the PDF.</p>
          ) : null}
        </div>
        {canChange ? (
          <button
            type="button"
            className="reader-change"
            onClick={() => setDocumentId(null)}
          >
            Change
          </button>
        ) : null}
      </header>
      <ReaderPdf
        fileId={documentId}
        page={readerPage}
        marks={marks}
        activeMarkId={activeMarkId}
        onPageChange={setReaderPage}
        onAsk={onAsk}
        onHighlight={onHighlight}
        onSelection={(selection) =>
          setReaderSelection(
            selection
              ? { ...selection, fileName: file?.name }
              : null,
          )
        }
      />
      {marks.length > 0 ? (
        <ul className="reader-marks" aria-label="Highlights">
          {marks.map((mark) => (
            <li key={mark.id}>
              <button
                type="button"
                className={mark.id === activeMarkId ? 'is-active' : undefined}
                onClick={() => {
                  setActiveMarkId(mark.id);
                  setReaderPage(mark.page);
                }}
              >
                <span>p.{mark.page}</span>
                {mark.quote}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
};

export default ReaderPane;
