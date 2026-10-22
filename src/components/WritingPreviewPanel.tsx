'use client';

import { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import { getAuthHeaders } from '@/lib/utils/auth';
import { formatWritingBytes } from '@/lib/writing/types';
import { HtmlPageEmbed } from './HtmlPageEmbed';
import PreviewTabBar from './PreviewTabBar';
import { useRightPanel } from './RightPanelContext';

type FilePayload = {
  path: string;
  name: string;
  content: string;
  language: string;
};

type ViewMode = 'source' | 'preview';

function utf8Size(text: string): number {
  return new TextEncoder().encode(text).length;
}

function downloadMarkdown(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const base = name.replace(/\.[^.]+$/, '') || name;
  link.href = url;
  link.download = base.toLowerCase().endsWith('.md') ? base : `${base}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

function WritingFileView({ fileId }: { fileId: string }) {
  const [file, setFile] = useState<FilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('preview');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFile(null);
    void (async () => {
      try {
        const res = await fetch(
          `/itms/ai/api/writing/files/${encodeURIComponent(fileId)}/file`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            (data && typeof data.message === 'string' && data.message) ||
              'Could not load file',
          );
        }
        if (cancelled) return;
        setFile({
          path: data.path,
          name: data.name,
          content: data.content,
          language: data.language,
        });
        setView('preview');
      } catch (err) {
        if (cancelled) return;
        setFile(null);
        setError(err instanceof Error ? err.message : 'Could not load file');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const title = file?.name || 'File';
  const lineCount = file ? file.content.split('\n').length : 0;
  const sizeLabel = file ? formatWritingBytes(utf8Size(file.content)) : '';
  const metadata = file
    ? `${file.language} · ${lineCount} lines${sizeLabel ? ` · ${sizeLabel}` : ''}`
    : '';

  return (
    <div className="file-viewer-shell">
      <div className="file-viewer-toolbar">
        <span className="file-viewer-path" title={file?.path || title}>
          {title}
        </span>
        {metadata ? (
          <span className="file-viewer-meta" title={metadata}>
            {metadata}
          </span>
        ) : null}
        <div className="file-viewer-controls">
          <div className="file-viewer-mode-switch" aria-label="File view mode">
            <button
              type="button"
              className={`file-viewer-mode-button${view === 'source' ? ' is-active' : ''}`}
              aria-pressed={view === 'source'}
              onClick={() => setView('source')}
            >
              Source
            </button>
            <button
              type="button"
              className={`file-viewer-mode-button${view === 'preview' ? ' is-active' : ''}`}
              aria-pressed={view === 'preview'}
              onClick={() => setView('preview')}
            >
              Preview
            </button>
          </div>
          <button
            type="button"
            className="file-viewer-icon-button"
            title="Download file"
            aria-label="Download file"
            disabled={!file}
            onClick={() => {
              if (file) downloadMarkdown(file.name || title, file.content);
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>
      <div className="document-preview-body">
        {error ? (
          <p className="document-preview-empty">{error}</p>
        ) : !file ? (
          <p className="document-preview-empty">Loading…</p>
        ) : view === 'source' ? (
          <pre className="document-preview-source">{file.content}</pre>
        ) : (
          <div className="document-preview-markdown markdown-file-preview content markdown">
            <Markdown>{file.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WritingPreviewPanel() {
  const {
    previewTabs,
    activePreviewTabId,
    selectPreviewTab,
    closePreviewTab,
  } = useRightPanel();
  const active =
    previewTabs.find((tab) => tab.id === activePreviewTabId) ?? null;

  return (
    <div className="document-preview writing-preview">
      {previewTabs.length > 0 ? (
        <PreviewTabBar
          tabs={previewTabs}
          activeTabId={active?.id ?? ''}
          onSelectTab={selectPreviewTab}
          onCloseTab={closePreviewTab}
        />
      ) : null}
      {active?.kind === 'html' && active.pageId ? (
        <div className="document-preview-body">
          <HtmlPageEmbed pageId={active.pageId} />
        </div>
      ) : active?.kind === 'file' && active.fileId ? (
        <WritingFileView key={active.fileId} fileId={active.fileId} />
      ) : (
        <p className="document-preview-empty">Select a file to preview.</p>
      )}
    </div>
  );
}
