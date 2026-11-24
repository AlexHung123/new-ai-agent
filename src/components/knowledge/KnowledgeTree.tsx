'use client';

import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { isStructuredKnowledgeNode } from '@/lib/knowledge/tree';
import { FileText } from 'lucide-react';
import { useState } from 'react';

function FolderRows({
  node,
  currentPath,
  collapsed,
  onToggle,
  onSelect,
  onDropFiles,
}: {
  node: KnowledgeTreeNode;
  currentPath: string;
  collapsed: Record<string, boolean>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onDropFiles: (path: string, files: FileList) => void;
}) {
  const folders = (node.children || []).filter((child) => child.type === 'dir');
  return (
    <ul className="knowledge-tree-list">
      {folders.map((folder) => {
        const structured = isStructuredKnowledgeNode(folder);
        const hasKids =
          !structured &&
          (folder.children || []).some((child) => child.type === 'dir');
        const open = hasKids && !collapsed[folder.path];
        return (
          <li key={folder.path}>
            <div className="knowledge-tree-row">
              {hasKids ? (
                <button
                  type="button"
                  className="knowledge-tree-toggle"
                  aria-expanded={open}
                  aria-label={open ? 'Collapse folder' : 'Expand folder'}
                  onClick={() => onToggle(folder.path)}
                >
                  {open ? '▾' : '▸'}
                </button>
              ) : (
                <span className="knowledge-tree-toggle-spacer" />
              )}
              <button
                type="button"
                className={
                  folder.path === currentPath
                    ? 'knowledge-tree-item is-active'
                    : 'knowledge-tree-item'
                }
                onClick={() => onSelect(folder.path)}
                onDragOver={(event) => {
                  if (!structured) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (structured) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.dataTransfer.files?.length) {
                    onDropFiles(folder.path, event.dataTransfer.files);
                  }
                }}
              >
                {structured ? (
                  <span className="knowledge-tree-file-icon" aria-hidden>
                    <FileText size={14} />
                  </span>
                ) : (
                  <span className="knowledge-tree-folder-icon" aria-hidden>
                    📁
                  </span>
                )}
                <span className="knowledge-tree-item-name">{folder.name}</span>
                {structured ? (
                  <span className="knowledge-structured-badge">Structured</span>
                ) : null}
              </button>
            </div>
            {open ? (
              <FolderRows
                node={folder}
                currentPath={currentPath}
                collapsed={collapsed}
                onToggle={onToggle}
                onSelect={onSelect}
                onDropFiles={onDropFiles}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function KnowledgeTree({
  node,
  currentPath,
  onSelect,
  onDropFiles,
}: {
  node: KnowledgeTreeNode;
  currentPath: string;
  onSelect: (path: string) => void;
  onDropFiles: (path: string, files: FileList) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  return (
    <FolderRows
      node={node}
      currentPath={currentPath}
      collapsed={collapsed}
      onToggle={(path) =>
        setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }))
      }
      onSelect={onSelect}
      onDropFiles={onDropFiles}
    />
  );
}
