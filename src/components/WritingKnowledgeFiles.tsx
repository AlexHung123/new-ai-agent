'use client';

import { useState, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  Lock,
} from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import {
  formatKnowledgePin,
  parseKnowledgePin,
  type KnowledgeLibrary,
} from '@/lib/knowledge/library';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { useRightPanel } from './RightPanelContext';

function dirPaths(node: KnowledgeTreeNode, library: KnowledgeLibrary): string[] {
  const out: string[] = [];
  for (const child of node.children || []) {
    if (child.type === 'dir') {
      const key = formatKnowledgePin({ library, path: child.path });
      out.push(key, ...dirPaths(child, library));
    }
  }
  return out;
}

function TreeRows({
  node,
  library,
  activePin,
  collapsed,
  onToggle,
  onSelectFolder,
  onOpenFile,
}: {
  node: KnowledgeTreeNode;
  library: KnowledgeLibrary;
  activePin: string;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSelectFolder: (library: KnowledgeLibrary, path: string) => void;
  onOpenFile: (id: string, label: string) => void;
}) {
  const children = node.children || [];
  if (children.length === 0) return null;
  return (
    <ul className="writing-knowledge-list">
      {children.map((child) => {
        const pin = formatKnowledgePin({ library, path: child.path });
        if (child.type === 'dir') {
          const hasChildren = (child.children || []).length > 0;
          const open = hasChildren && !collapsed[pin];
          return (
            <li key={pin}>
              <div className="writing-knowledge-row">
                {hasChildren ? (
                  <button
                    type="button"
                    className="writing-knowledge-toggle"
                    aria-expanded={open}
                    aria-label={open ? `Collapse ${child.name}` : `Expand ${child.name}`}
                    onClick={() => onToggle(pin)}
                  >
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : (
                  <span className="writing-knowledge-toggle-spacer" />
                )}
                <button
                  type="button"
                  className={`writing-knowledge-item${pin === activePin ? ' is-active' : ''}`}
                  onClick={() => onSelectFolder(library, child.path)}
                  onDoubleClick={() => {
                    if (hasChildren) onToggle(pin);
                  }}
                >
                  <span className="writing-knowledge-icon is-folder" aria-hidden>
                    {open ? <FolderOpen size={15} /> : <Folder size={15} />}
                  </span>
                  <span className="writing-knowledge-label">{child.name}</span>
                  {child.wiki ? (
                    <span className="writing-knowledge-wiki-badge">Structured</span>
                  ) : null}
                </button>
              </div>
              {open ? (
                <TreeRows
                  node={child}
                  library={library}
                  activePin={activePin}
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
          <li key={pin || child.name}>
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

function Section({
  library,
  title,
  icon,
  tree,
  empty,
  activePin,
  collapsed,
  onToggle,
  onSelectFolder,
  onOpenFile,
}: {
  library: KnowledgeLibrary;
  title: string;
  icon: ReactNode;
  tree: KnowledgeTreeNode;
  empty: string;
  activePin: string;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSelectFolder: (library: KnowledgeLibrary, path: string) => void;
  onOpenFile: (id: string, label: string) => void;
}) {
  const count = (tree.children || []).length;
  return (
    <section className="writing-knowledge-section" data-library={library}>
      <h3 className="writing-knowledge-section-title">
        <span className="writing-knowledge-section-icon" aria-hidden>
          {icon}
        </span>
        {title}
      </h3>
      {count === 0 ? (
        <p className="writing-knowledge-empty">{empty}</p>
      ) : (
        <TreeRows
          node={tree}
          library={library}
          activePin={activePin}
          collapsed={collapsed}
          onToggle={onToggle}
          onSelectFolder={onSelectFolder}
          onOpenFile={onOpenFile}
        />
      )}
    </section>
  );
}

export default function WritingKnowledgeFiles() {
  const { privateTree, publicTree, error, loading } = useKnowledgeTree();
  const { knowledgeFolder, setKnowledgeFolder } = useChat();
  const { openKnowledgeFile } = useRightPanel();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const activePin = knowledgeFolder || '';

  const onToggle = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSelectFolder = (library: KnowledgeLibrary, path: string) => {
    const current = parseKnowledgePin(knowledgeFolder);
    const next = formatKnowledgePin({ library, path });
    if (current?.library === library && current.path === path) {
      setKnowledgeFolder('');
      return;
    }
    setKnowledgeFolder(next);
  };

  const allDirKeys = [
    ...dirPaths(privateTree, 'private'),
    ...dirPaths(publicTree, 'public'),
  ];

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
              setCollapsed(Object.fromEntries(allDirKeys.map((path) => [path, true])))
            }
          >
            <ChevronsUp size={14} />
          </button>
        </div>
      </div>
      {error ? <p className="writing-knowledge-error">{error}</p> : null}
      {loading &&
      (privateTree.children || []).length === 0 &&
      (publicTree.children || []).length === 0 ? (
        <p className="writing-knowledge-empty">Loading files…</p>
      ) : (
        <>
          <Section
            library="private"
            title="Private"
            icon={<Lock size={13} />}
            tree={privateTree}
            empty="Upload documents on Knowledge."
            activePin={activePin}
            collapsed={collapsed}
            onToggle={onToggle}
            onSelectFolder={onSelectFolder}
            onOpenFile={openKnowledgeFile}
          />
          <Section
            library="public"
            title="Public"
            icon={<Globe size={13} />}
            tree={publicTree}
            empty="Shared policy folders will appear here."
            activePin={activePin}
            collapsed={collapsed}
            onToggle={onToggle}
            onSelectFolder={onSelectFolder}
            onOpenFile={openKnowledgeFile}
          />
        </>
      )}
    </div>
  );
}
