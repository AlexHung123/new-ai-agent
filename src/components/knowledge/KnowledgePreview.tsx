'use client';

import Markdown from 'markdown-to-jsx';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import DocumentNativePreview from '@/components/DocumentNativePreview';
import HtmlDocumentPreview from '@/components/HtmlDocumentPreview';
import {
  usesHtmlDocumentPreview,
  usesNativeDocumentPreview,
} from '@/lib/writing/fileKind';

export default function KnowledgePreview({
  markdown,
  file,
  filename,
  error,
  loading,
  title,
  onClose,
}: {
  markdown: string | null;
  file?: Blob | null;
  filename?: string | null;
  error: string | null;
  loading?: boolean;
  title?: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const native = Boolean(
    file && filename && usesNativeDocumentPreview(filename),
  );
  const htmlPreview = Boolean(
    file && filename && usesHtmlDocumentPreview(filename),
  );
  const open = Boolean(markdown || file || error || loading);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`knowledge-preview-dialog${native || htmlPreview ? ' is-native' : ''}${htmlPreview ? ' is-html' : ''}`}
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
        ) : loading ? (
          <p className="knowledge-preview-loading">Loading preview…</p>
        ) : native && file && filename ? (
          <div className="knowledge-preview-native">
            <DocumentNativePreview file={file} name={filename} />
          </div>
        ) : htmlPreview && file && filename ? (
          <div className="knowledge-preview-native knowledge-preview-html">
            <HtmlDocumentPreview file={file} title={filename} />
          </div>
        ) : (
          <div className="knowledge-preview-markdown content markdown">
            <Markdown>{markdown || ''}</Markdown>
          </div>
        )}
      </div>
    </dialog>
  );
}
