'use client';

import { ingestBadge } from '@/lib/knowledge/taskStatus';
import type {
  KnowledgeSearchHit,
  KnowledgeTask,
  KnowledgeTreeNode,
} from '@/lib/knowledge/types';

export default function KnowledgeListing({
  items,
  hits,
  searching,
  tasks,
  onOpenDir,
  onOpenFile,
  onOpenHit,
  onDropFiles,
}: {
  items: KnowledgeTreeNode[];
  hits: KnowledgeSearchHit[] | null;
  searching: boolean;
  tasks: Record<string, KnowledgeTask>;
  onOpenDir: (path: string) => void;
  onOpenFile: (id: string) => void;
  onOpenHit: (hit: KnowledgeSearchHit) => void;
  onDropFiles: (files: FileList) => void;
}) {
  return (
    <div
      className="knowledge-listing"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (event.dataTransfer.files?.length) onDropFiles(event.dataTransfer.files);
      }}
    >
      {searching && hits ? (
        hits.length === 0 ? (
          <p className="knowledge-empty">No matching files.</p>
        ) : (
          <ul className="knowledge-hit-list">
            {hits.map((hit, index) => (
              <li key={`${hit.file}-${index}`}>
                <button
                  type="button"
                  className="knowledge-hit"
                  data-hit-file={hit.file}
                  onClick={() => onOpenHit(hit)}
                >
                  <strong>{hit.title || hit.file}</strong>
                  <span>{hit.snippet}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : items.length === 0 ? (
        <p className="knowledge-empty">Create a folder or drop files here.</p>
      ) : (
        <ul className="knowledge-item-list">
          {items.map((item) => {
            const taskId = item.file?.task_id;
            const badge = taskId ? ingestBadge(tasks[taskId]) : null;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  className="knowledge-item"
                  onClick={() =>
                    item.type === 'dir'
                      ? onOpenDir(item.path)
                      : item.file && onOpenFile(item.file.id)
                  }
                >
                  {item.name}
                  {badge === 'indexing' ? (
                    <span className="knowledge-badge">Indexing</span>
                  ) : null}
                  {badge === 'embedding' ? (
                    <span className="knowledge-badge">Embedding</span>
                  ) : null}
                  {badge === 'failed' ? (
                    <span className="knowledge-badge is-failed">Failed</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
