'use client';

import { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import DocumentNativePreview from '@/components/DocumentNativePreview';
import { getAuthBearerHeaders, getAuthHeaders } from '@/lib/utils/auth';
import { usesNativeDocumentPreview } from '@/lib/writing/fileKind';
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

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name || 'download';
  link.click();
  URL.revokeObjectURL(url);
}

function downloadMarkdown(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const base = name.replace(/\.[^.]+$/, '') || name;
  downloadBlob(base.toLowerCase().endsWith('.md') ? base : `${base}.md`, blob);
}

function WritingFileView({
  fileId,
  source,
  label,
}: {
  fileId: string;
  source?: 'knowledge' | 'writing';
  label?: string;
}) {
  const [file, setFile] = useState<FilePayload | null>(null);
  const [original, setOriginal] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('preview');

  const filename = file?.name || label || fileId;
  const native = usesNativeDocumentPreview(filename);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFile(null);
    setOriginal(null);
    setView('preview');
    void (async () => {
      try {
        if (source === 'knowledge') {
          const name = label || fileId;
          if (usesNativeDocumentPreview(name)) {
            const [inboxRes, markdownRes] = await Promise.all([
              fetch(
                `/itms/ai/api/knowledge/files/${encodeURIComponent(fileId)}/content?tree=inbox`,
                { headers: getAuthBearerHeaders() },
              ),
              fetch(
                `/itms/ai/api/knowledge/files/${encodeURIComponent(fileId)}/content?tree=markdown`,
                { headers: getAuthHeaders() },
              ),
            ]);
            if (!inboxRes.ok) {
              const data = await inboxRes.json().catch(() => null);
              throw new Error(
                (data && typeof data.message === 'string' && data.message) ||
                  'Could not load file',
              );
            }
            const blob = await inboxRes.blob();
            let markdown = '';
            if (markdownRes.ok) {
              markdown = await markdownRes.text();
            }
            if (cancelled) return;
            setOriginal(blob);
            setFile({
              path: name,
              name,
              content: markdown,
              language: 'markdown',
            });
            return;
          }
          const res = await fetch(
            `/itms/ai/api/knowledge/files/${encodeURIComponent(fileId)}/content?tree=markdown`,
            { headers: getAuthHeaders() },
          );
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(
              (data && typeof data.message === 'string' && data.message) ||
                'Could not load file',
            );
          }
          const content = await res.text();
          if (cancelled) return;
          setFile({
            path: label || fileId,
            name: label || fileId,
            content,
            language: 'markdown',
          });
          return;
        }
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
        const payload: FilePayload = {
          path: data.path,
          name: data.name,
          content: data.content,
          language: data.language,
        };
        setFile(payload);
        if (usesNativeDocumentPreview(data.name || label || '')) {
          const originalRes = await fetch(
            `/itms/ai/api/writing/files/${encodeURIComponent(fileId)}/original`,
            { headers: getAuthBearerHeaders() },
          );
          if (originalRes.ok) {
            const blob = await originalRes.blob();
            if (cancelled) return;
            setOriginal(blob);
          }
        }
      } catch (err) {
        if (cancelled) return;
        setFile(null);
        setOriginal(null);
        setError(err instanceof Error ? err.message : 'Could not load file');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId, label, source]);

  const title = file?.name || label || 'File';
  const lineCount = file ? file.content.split('\n').length : 0;
  const sizeLabel = original
    ? formatWritingBytes(original.size)
    : file
      ? formatWritingBytes(utf8Size(file.content))
      : '';
  const metadata = file
    ? native
      ? `${fileExtensionLabel(title)}${sizeLabel ? ` · ${sizeLabel}` : ''}`
      : `${file.language} · ${lineCount} lines${sizeLabel ? ` · ${sizeLabel}` : ''}`
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
            disabled={!file && !original}
            onClick={() => {
              if (original) {
                downloadBlob(title, original);
                return;
              }
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
        ) : !file && !original ? (
          <p className="document-preview-empty">Loading…</p>
        ) : view === 'source' ? (
          file ? (
            <pre className="document-preview-source">{file.content}</pre>
          ) : (
            <p className="document-preview-empty">
              Extracted text is not available for this file.
            </p>
          )
        ) : native && original ? (
          <DocumentNativePreview file={original} name={title} />
        ) : (
          <div className="document-preview-markdown markdown-file-preview content markdown">
            <Markdown>{file?.content || ''}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

function fileExtensionLabel(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext && ext !== name.toUpperCase() ? ext : 'FILE';
}

export default function WritingPreviewPanel() {
  const { previewTabs, activePreviewTabId, selectPreviewTab, closePreviewTab } =
    useRightPanel();
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
        <WritingFileView
          key={active.id}
          fileId={active.fileId}
          source={active.source}
          label={active.label}
        />
      ) : (
        <p className="document-preview-empty">Select a file to preview.</p>
      )}
    </div>
  );
}
