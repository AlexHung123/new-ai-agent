'use client';

import Markdown from 'markdown-to-jsx';

export default function KnowledgePreview({
  markdown,
  error,
}: {
  markdown: string | null;
  error: string | null;
}) {
  if (!markdown && !error) return null;
  return (
    <aside className="knowledge-preview is-open">
      {error ? (
        <p className="knowledge-preview-error">
          {error === 'File not found.' ? 'File not found.' : error}
        </p>
      ) : (
        <div className="knowledge-preview-markdown content markdown">
          <Markdown>{markdown || ''}</Markdown>
        </div>
      )}
    </aside>
  );
}
