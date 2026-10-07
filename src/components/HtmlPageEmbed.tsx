'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/utils/auth';
import { htmlPageHref } from '@/lib/html/pageLink';

export function HtmlPageEmbed({ pageId }: { pageId: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const href = htmlPageHref(pageId);
    void (async () => {
      try {
        const res = await fetch(href, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Could not load page (${res.status})`);
        const text = await res.text();
        if (!cancelled) setHtml(text);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load page');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const download = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="html-page-embed">
      <div className="html-page-embed-bar">
        <span className="html-page-embed-label">HTML page</span>
        <button
          type="button"
          className="html-page-embed-download"
          onClick={download}
          disabled={!html}
        >
          Download
        </button>
      </div>
      {error ? (
        <p className="html-page-embed-error">{error}</p>
      ) : html ? (
        <iframe
          className="html-page-embed-frame"
          title="HTML explainer page"
          sandbox="allow-scripts"
          srcDoc={html}
        />
      ) : (
        <p className="html-page-embed-loading">Loading page…</p>
      )}
    </div>
  );
}
