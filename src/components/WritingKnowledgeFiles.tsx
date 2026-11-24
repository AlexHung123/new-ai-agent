'use client';

import { useEffect, useRef, useState } from 'react';
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
import {
  formatKnowledgePin,
  parseKnowledgePin,
  type KnowledgeLibrary,
} from '@/lib/knowledge/library';
import { readLibraryTab, writeLibraryTab } from '@/lib/knowledge/libraryTab';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import KnowledgeLibraryTabs from './KnowledgeLibraryTabs';
import { isStructuredKnowledgeNode } from '@/lib/knowledge/tree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { useRightPanel } from './RightPanelContext';

function dirPaths(node: KnowledgeTreeNode, library: KnowledgeLibrary): string[] {
  const out: string[] = [];
  for (const child of node.children || []) {
    if (child.type === 'dir') {
      if (isStructuredKnowledgeNode(child)) continue;
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
          const structured = isStructuredKnowledgeNode(child);
          const hasChildren = !structured && (child.children || []).length > 0;
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
                  <span
                    className={`writing-knowledge-icon ${structured ? 'is-file' : 'is-folder'}`}
                    aria-hidden
                  >
                    {structured ? (
                      <FileText size={15} />
                    ) : open ? (
                      <FolderOpen size={15} />
                    ) : (
                      <Folder size={15} />
                    )}
                  </span>
                  <span className="writing-knowledge-label">{child.name}</span>
                  {structured ? (
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


export default function WritingKnowledgeFiles() {
  const { privateTree, publicTree, error, loading } = useKnowledgeTree();
  const { knowledgeFolder, setKnowledgeFolder } = useChat();
  const { openKnowledgeFile } = useRightPanel();
  const [library, setLibrary] = useState<KnowledgeLibrary>(() => readLibraryTab());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const lastPinRef = useRef(knowledgeFolder);
  const activePin = knowledgeFolder || '';
  const activeTree = library === 'public' ? publicTree : privateTree;
  const empty =
    library === 'public'
      ? 'Shared policy folders will appear here.'
      : 'Upload documents on Knowledge.';

  useEffect(() => {
    if (lastPinRef.current === knowledgeFolder) return;
    lastPinRef.current = knowledgeFolder;
    const pin = parseKnowledgePin(knowledgeFolder);
    if (pin?.path) {
      setLibrary(pin.library);
      writeLibraryTab(pin.library);
    }
  }, [knowledgeFolder]);

  const onSelectTab = (next: KnowledgeLibrary) => {
    setLibrary(next);
    writeLibraryTab(next);
  };

  const onToggle = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSelectFolder = (nextLibrary: KnowledgeLibrary, path: string) => {
    const current = parseKnowledgePin(knowledgeFolder);
    const next = formatKnowledgePin({ library: nextLibrary, path });
    if (current?.library === nextLibrary && current.path === path) {
      setKnowledgeFolder('');
      return;
    }
    setKnowledgeFolder(next);
  };

  const visibleDirKeys = dirPaths(activeTree, library);
  const showLoading =
    loading &&
    (privateTree.children || []).length === 0 &&
    (publicTree.children || []).length === 0;

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
                Object.fromEntries(visibleDirKeys.map((path) => [path, true])),
              )
            }
          >
            <ChevronsUp size={14} />
          </button>
        </div>
      </div>
      <KnowledgeLibraryTabs value={library} onChange={onSelectTab} />
      {error ? <p className="writing-knowledge-error">{error}</p> : null}
      {showLoading ? (
        <p className="writing-knowledge-empty">Loading files…</p>
      ) : (activeTree.children || []).length === 0 ? (
        <p className="writing-knowledge-empty">{empty}</p>
      ) : (
        <TreeRows
          node={activeTree}
          library={library}
          activePin={activePin}
          collapsed={collapsed}
          onToggle={onToggle}
          onSelectFolder={onSelectFolder}
          onOpenFile={openKnowledgeFile}
        />
      )}
    </div>
  );
}
