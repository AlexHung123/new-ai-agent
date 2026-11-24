'use client';

import {
  formatKnowledgeDateTime,
  formatStorageBytes,
} from '@/lib/knowledge/storage';
import { parseLabel } from '@/lib/knowledge/taskStatus';
import { isStructuredKnowledgeNode } from '@/lib/knowledge/tree';
import type {
  KnowledgeFileMeta,
  KnowledgeSearchHit,
  KnowledgeTask,
  KnowledgeTreeNode,
} from '@/lib/knowledge/types';

function parseClass(label: ReturnType<typeof parseLabel>): string {
  if (label === 'Failed') return 'knowledge-parse is-failed';
  if (label === 'done') return 'knowledge-parse is-done';
  return 'knowledge-parse';
}

export default function KnowledgeListing({
  items,
  hits,
  searching,
  tasks,
  onOpenDir,
  onOpenStructured,
  onOpenFile,
  onOpenHit,
  onDownload,
  onDropFiles,
}: {
  items: KnowledgeTreeNode[];
  hits: KnowledgeSearchHit[] | null;
  searching: boolean;
  tasks: Record<string, KnowledgeTask>;
  onOpenDir: (path: string) => void;
  onOpenStructured: (path: string) => void;
  onOpenFile: (id: string, name?: string) => void;
  onOpenHit: (hit: KnowledgeSearchHit) => void;
  onDownload: (file: KnowledgeFileMeta) => void;
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
          <div className="knowledge-files-table-wrap">
            <table className="knowledge-files-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Upload date</th>
                  <th>Parse</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hits.map((hit, index) => (
                  <tr key={`${hit.file}-${index}`}>
                    <td>
                      <button
                        type="button"
                        className="knowledge-hit"
                        data-hit-file={hit.file}
                        onClick={() => onOpenHit(hit)}
                      >
                        <strong>{hit.title || hit.file}</strong>
                        <span>{hit.snippet}</span>
                      </button>
                    </td>
                    <td>—</td>
                    <td />
                    <td>
                      <button
                        type="button"
                        className="knowledge-action"
                        onClick={() => onOpenHit(hit)}
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : items.length === 0 ? (
        <p className="knowledge-empty">Create a folder or drop files here.</p>
      ) : (
        <div className="knowledge-files-table-wrap">
          <table className="knowledge-files-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Upload date</th>
                <th>Parse</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const structured = isStructuredKnowledgeNode(item);
                const taskId = item.file?.task_id;
                const label =
                  item.type === 'file'
                    ? parseLabel(taskId ? tasks[taskId] : null)
                    : null;
                return (
                  <tr key={item.path}>
                    <td>
                      <button
                        type="button"
                        className="knowledge-file-name"
                        onClick={() => {
                          if (structured) {
                            onOpenStructured(item.path);
                            return;
                          }
                          if (item.type === 'dir') {
                            onOpenDir(item.path);
                            return;
                          }
                          if (item.file) onOpenFile(item.file.id, item.name);
                        }}
                      >
                        <span className="knowledge-file-name-row">
                          {structured ? (
                            <span className="knowledge-file-doc-icon" aria-hidden>
                              📄
                            </span>
                          ) : item.type === 'dir' ? (
                            <span aria-hidden>📁</span>
                          ) : null}
                          <span>{item.name}</span>
                          {structured ? (
                            <span className="knowledge-structured-badge">
                              Structured
                            </span>
                          ) : null}
                        </span>
                        {item.file ? (
                          <span className="knowledge-file-sub">
                            {formatStorageBytes(item.file.size_bytes)}
                          </span>
                        ) : structured ? (
                          <span className="knowledge-file-sub">
                            Bound document
                          </span>
                        ) : null}
                      </button>
                    </td>
                    <td>
                      {item.type === 'file'
                        ? formatKnowledgeDateTime(item.file?.created_at)
                        : '—'}
                    </td>
                    <td>
                      {label ? (
                        <span
                          className={parseClass(label)}
                          title={
                            label === 'Failed'
                              ? tasks[taskId || '']?.last_error || undefined
                              : undefined
                          }
                        >
                          {label}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {structured ? (
                        <div className="knowledge-actions">
                          <button
                            type="button"
                            className="knowledge-action"
                            onClick={() => onOpenStructured(item.path)}
                          >
                            Preview
                          </button>
                        </div>
                      ) : item.file ? (
                        <div className="knowledge-actions">
                          <button
                            type="button"
                            className="knowledge-action"
                            onClick={() =>
                              onOpenFile(item.file!.id, item.name)
                            }
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className="knowledge-action"
                            onClick={() => onDownload(item.file!)}
                          >
                            Download
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
