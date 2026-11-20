'use client';

import { useChat } from '@/lib/hooks/useChat';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { useRightPanel } from './RightPanelContext';

function TreeRows({
  node,
  knowledgeFolder,
  onSelectFolder,
  onOpenFile,
}: {
  node: KnowledgeTreeNode;
  knowledgeFolder: string;
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
      {children.map((child) => (
        <li key={child.path || child.name}>
          {child.type === 'dir' ? (
            <>
              <button
                type="button"
                className={`writing-knowledge-item${
                  child.path === knowledgeFolder ? ' is-active' : ''
                }`}
                onClick={() => onSelectFolder(child.path)}
              >
                {child.name}
              </button>
              <TreeRows
                node={child}
                knowledgeFolder={knowledgeFolder}
                onSelectFolder={onSelectFolder}
                onOpenFile={onOpenFile}
              />
            </>
          ) : (
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
              {child.file?.original_filename || child.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function WritingKnowledgeFiles() {
  const { tree, error } = useKnowledgeTree('/itms/ai/api/knowledge/tree');
  const { knowledgeFolder, setKnowledgeFolder } = useChat();
  const { openKnowledgeFile } = useRightPanel();

  return (
    <div className="writing-knowledge-files">
      <div className="writing-knowledge-files-header">
        <button type="button" onClick={() => setKnowledgeFolder('')}>
          FILES
        </button>
      </div>
      {error ? <p className="writing-knowledge-error">{error}</p> : null}
      <TreeRows
        node={tree}
        knowledgeFolder={knowledgeFolder}
        onSelectFolder={setKnowledgeFolder}
        onOpenFile={openKnowledgeFile}
      />
    </div>
  );
}
