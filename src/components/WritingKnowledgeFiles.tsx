'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { useRightPanel } from './RightPanelContext';

function dirPaths(node: KnowledgeTreeNode): string[] {
  const out: string[] = [];
  for (const child of node.children || []) {
    if (child.type === 'dir') {
      out.push(child.path, ...dirPaths(child));
    }
  }
  return out;
}

function TreeRows({
  node,
  knowledgeFolder,
  collapsed,
  onToggle,
  onSelectFolder,
  onOpenFile,
}: {
  node: KnowledgeTreeNode;
  knowledgeFolder: string;
  collapsed: Record<string, boolean>;
  onToggle: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onOpenFile: (id: string, label: string) => void;
}) {
  const children = node.children || [];
  if (children.length === 0) {
    return node.path === '' ? (
      <p className="writing-knowledge-empty">Upload documents on Knowledge.</p>
    ) : null;
  }
  return (
    <ul className="writing-knowledge-list">
      {children.map((child) => {
        if (child.type === 'dir') {
          const hasChildren = (child.children || []).length > 0;
          const open = hasChildren && !collapsed[child.path];
          return (
            <li key={child.path || child.name}>
              <div className="writing-knowledge-row">
                {hasChildren ? (
                  <button
                    type="button"
                    className="writing-knowledge-toggle"
                    aria-expanded={open}
                    aria-label={open ? `Collapse ${child.name}` : `Expand ${child.name}`}
                    onClick={() => onToggle(child.path)}
                  >
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : (
                  <span className="writing-knowledge-toggle-spacer" />
                )}
                <button
                  type="button"
                  className={`writing-knowledge-item${
                    child.path === knowledgeFolder ? ' is-active' : ''
                  }`}
                  onClick={() => onSelectFolder(child.path)}
                  onDoubleClick={() => {
                    if (hasChildren) onToggle(child.path);
                  }}
                >
                  <span className="writing-knowledge-icon is-folder" aria-hidden>
                    {open ? <FolderOpen size={15} /> : <Folder size={15} />}
                  </span>
                  <span className="writing-knowledge-label">{child.name}</span>
                </button>
              </div>
              {open ? (
                <TreeRows
                  node={child}
                  knowledgeFolder={knowledgeFolder}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  onSelectFolder={onSelectFolder}
                  onOpenFile={onOpenFile}
                />
              ) : null}
            </li>
          );
        }
        return (
          <li key={child.path || child.name}>
            <div className="writing-knowledge-row">
              <span className="writing-knowledge-toggle-spacer" />
              <button
                type="button"
                className="writing-knowledge-item"
                onClick={() => {
                  if (child.file) {
                    onOpenFile(
                      child.file.id,
                      child.file.original_filename || child.name,
                    );
                  }
                }}
              >
                <span className="writing-knowledge-icon is-file" aria-hidden>
                  <FileText size={15} />
                </span>
                <span className="writing-knowledge-label">
                  {child.file?.original_filename || child.name}
                </span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function WritingKnowledgeFiles() {
  const { tree, error } = useKnowledgeTree('/itms/ai/api/knowledge/tree');
  const { knowledgeFolder, setKnowledgeFolder } = useChat();
  const { openKnowledgeFile } = useRightPanel();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const onToggle = (path: string) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="writing-knowledge-files">
      <div className="writing-knowledge-files-header">
        <button type="button" onClick={() => setKnowledgeFolder('')}>
          FILES
        </button>
        <div className="writing-knowledge-tree-actions">
          <button
            type="button"
            aria-label="Expand all folders"
            title="Expand all"
            onClick={() => setCollapsed({})}
          >
            <ChevronsDown size={14} />
          </button>
          <button
            type="button"
            aria-label="Collapse all folders"
            title="Collapse all"
            onClick={() =>
              setCollapsed(
                Object.fromEntries(dirPaths(tree).map((path) => [path, true])),
              )
            }
          >
            <ChevronsUp size={14} />
          </button>
        </div>
      </div>
      {error ? <p className="writing-knowledge-error">{error}</p> : null}
      <TreeRows
        node={tree}
        knowledgeFolder={knowledgeFolder}
        collapsed={collapsed}
        onToggle={onToggle}
        onSelectFolder={setKnowledgeFolder}
        onOpenFile={openKnowledgeFile}
      />
    </div>
  );
}
