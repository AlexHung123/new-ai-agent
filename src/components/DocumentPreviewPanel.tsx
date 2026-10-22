'use client';

import { useEffect, useMemo, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import { useChat } from '@/lib/hooks/useChat';
import { getAuthHeaders } from '@/lib/utils/auth';
import { parseHtmlPageIds } from '@/lib/html/pageLink';
import { HtmlPageEmbed } from './HtmlPageEmbed';
import { useRightPanel } from './RightPanelContext';

type FilePayload = {
  path: string;
  content: string;
  language: string;
};

type ViewMode = 'source' | 'preview';

export default function DocumentPreviewPanel() {
  const { documentId, sections } = useChat();
  const { activeHtmlPageId, openHtmlPage } = useRightPanel();
  const filePath = 'AGENTS.md';
  const [file, setFile] = useState<FilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('preview');
  const [htmlTab, setHtmlTab] = useState<string | null>(null);

  const htmlPageIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const section of sections) {
      for (const id of parseHtmlPageIds(section.parsedAssistantMessage || '')) {
        if (seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
      }
    }
    return ids;
  }, [sections]);

  useEffect(() => {
    if (activeHtmlPageId) setHtmlTab(activeHtmlPageId);
  }, [activeHtmlPageId]);

  useEffect(() => {
    if (htmlTab && !htmlPageIds.includes(htmlTab)) setHtmlTab(null);
  }, [htmlPageIds, htmlTab]);

  useEffect(() => {
    if (!documentId) {
      setFile(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/itms/ai/api/documents/${documentId}/file?path=${encodeURIComponent(filePath)}`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            (data && typeof data.message === 'string' && data.message) ||
              `Could not load ${filePath}`,
          );
        }
        if (cancelled) return;
        setFile({
          path: data.path,
          content: data.content,
          language: data.language,
        });
      } catch (err) {
        if (cancelled) return;
        setFile(null);
        setError(err instanceof Error ? err.message : `Could not load ${filePath}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, filePath]);

  const showingHtml = Boolean(htmlTab);

  if (!documentId) {
    return (
      <div className="document-preview">
        <p className="document-preview-empty">Select a document to preview files.</p>
      </div>
    );
  }

  return (
    <div className="document-preview">
      <div className="document-preview-tabs">
        <button
          type="button"
          className={`html-canvas-tab${showingHtml ? '' : ' is-active'}`}
          onClick={() => setHtmlTab(null)}
        >
          {file?.path || filePath}
        </button>
        {htmlPageIds.map((id) => (
          <button
            key={id}
            type="button"
            className={`html-canvas-tab${htmlTab === id ? ' is-active' : ''}`}
            onClick={() => {
              setHtmlTab(id);
              openHtmlPage(id);
            }}
          >
            HTML page
          </button>
        ))}
        {showingHtml ? null : (
          <span className="document-preview-modes">
            <button
              type="button"
              className={`html-canvas-tab${view === 'source' ? ' is-active' : ''}`}
              onClick={() => setView('source')}
            >
              Source
            </button>
            <button
              type="button"
              className={`html-canvas-tab${view === 'preview' ? ' is-active' : ''}`}
              onClick={() => setView('preview')}
            >
              Preview
            </button>
          </span>
        )}
      </div>
      <div className="document-preview-body">
        {showingHtml && htmlTab ? (
          <HtmlPageEmbed pageId={htmlTab} />
        ) : error ? (
          <p className="document-preview-empty">{error}</p>
        ) : !file ? (
          <p className="document-preview-empty">Loading {filePath}…</p>
        ) : view === 'source' ? (
          <pre className="document-preview-source">{file.content}</pre>
        ) : file.language === 'html' ? (
          <iframe
            className="html-canvas-frame"
            title={file.path}
            sandbox="allow-scripts"
            srcDoc={file.content}
          />
        ) : (
          <div className="document-preview-markdown content markdown">
            <Markdown>{file.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
