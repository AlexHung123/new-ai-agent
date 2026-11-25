'use client';

import { useEffect, useState } from 'react';
import { wrapHtmlPreview } from '@/lib/html/previewDoc';
import { HTML_PREVIEW_SANDBOX } from '@/lib/html/tinymceInit';

export default function HtmlDocumentPreview({
  file,
  html,
  title,
}: {
  file?: Blob | null;
  html?: string | null;
  title?: string;
}) {
  const [doc, setDoc] = useState<string | null>(
    html != null ? wrapHtmlPreview(html) : null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (html != null) {
      setDoc(wrapHtmlPreview(html));
      setError(null);
      return;
    }
    if (!file) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    setError(null);
    void file
      .text()
      .then((text) => {
        if (cancelled) return;
        setDoc(wrapHtmlPreview(text));
      })
      .catch(() => {
        if (!cancelled) {
          setDoc(null);
          setError('Could not preview this HTML file.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [file, html]);

  if (error) return <p className="document-preview-empty">{error}</p>;
  if (!doc) return <p className="document-preview-empty">Loading preview…</p>;
  return (
    <iframe
      className="html-document-preview-frame"
      title={title || 'HTML preview'}
      sandbox={HTML_PREVIEW_SANDBOX}
      srcDoc={doc}
    />
  );
}
