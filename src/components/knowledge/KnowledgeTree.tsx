'use client';

import type { KnowledgeTreeNode } from '@/lib/knowledge/types';

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
  const folders = (node.children || []).filter((child) => child.type === 'dir');
  return (
    <ul className="knowledge-tree-list">
      {folders.map((folder) => (
        <li key={folder.path}>
          <button
            type="button"
            className={
              folder.path === currentPath
                ? 'knowledge-tree-item is-active'
                : 'knowledge-tree-item'
            }
            onClick={() => onSelect(folder.path)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (event.dataTransfer.files?.length) {
                onDropFiles(folder.path, event.dataTransfer.files);
              }
            }}
          >
            {folder.name}
          </button>
          {folder.children?.some((child) => child.type === 'dir') ? (
            <KnowledgeTree
              node={folder}
              currentPath={currentPath}
              onSelect={onSelect}
              onDropFiles={onDropFiles}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
