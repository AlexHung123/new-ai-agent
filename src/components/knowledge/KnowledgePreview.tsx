'use client';

import Markdown from 'markdown-to-jsx';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function KnowledgePreview({
  markdown,
  error,
  title,
  onClose,
}: {
  markdown: string | null;
  error: string | null;
  title?: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = Boolean(markdown || error);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="knowledge-preview-dialog"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="knowledge-preview-dialog-panel">
        <div className="knowledge-preview-dialog-head">
          <h2 className="knowledge-preview-dialog-title">
            {title || 'Preview'}
          </h2>
          <button
            type="button"
            className="knowledge-preview-dialog-close"
            aria-label="Close preview"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        {error ? (
          <p className="knowledge-preview-error">
            {error === 'File not found.' ? 'File not found.' : error}
          </p>
        ) : (
          <div className="knowledge-preview-markdown content markdown">
            <Markdown>{markdown || ''}</Markdown>
          </div>
        )}
      </div>
    </dialog>
  );
}
