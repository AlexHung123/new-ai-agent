'use client';

import { X } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';

const ReaderSelectionChip = () => {
  const { readerSelection, setReaderSelection, setReaderPage, focusMode } =
    useChat();

  if (focusMode !== 'agentReader' || !readerSelection?.quote.trim()) {
    return null;
  }

  const preview =
    readerSelection.quote.length > 72
      ? `${readerSelection.quote.slice(0, 72)}…`
      : readerSelection.quote;

  return (
    <div className="reader-sel-chip-row">
      <button
        type="button"
        className="reader-sel-chip"
        onClick={() => setReaderPage(readerSelection.page)}
        title="Jump to this page"
      >
        <span className="reader-sel-chip-page">p.{readerSelection.page}</span>
        <span className="reader-sel-chip-quote">{preview}</span>
      </button>
      <button
        type="button"
        className="reader-sel-chip-clear"
        aria-label="Remove selected text"
        onClick={() => setReaderSelection(null)}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ReaderSelectionChip;
