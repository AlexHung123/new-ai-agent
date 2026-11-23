'use client';

import { useEffect } from 'react';
import { FileText, Folder } from 'lucide-react';
import { flattenKnowledgeNodes } from '@/lib/knowledge/tree';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import { atQueryAtCursor, insertMention } from '@/lib/writing/mentions';

type Props = {
  text: string;
  cursor: number;
  onPick: (next: { text: string; cursor: number }) => void;
};

function parentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.slice(0, -1).join('/');
}

export default function WritingKnowledgeAtMenu({
  text,
  cursor,
  onPick,
}: Props) {
  const mention = atQueryAtCursor(text, cursor);
  const { tree } = useKnowledgeTree();
  const query = mention?.query.toLowerCase() ?? '';
  const nodes = mention
    ? flattenKnowledgeNodes(tree).filter((node) => {
        if (!node.path) return false;
        if (!query) return true;
        return (
          node.name.toLowerCase().includes(query) ||
          node.path.toLowerCase().includes(query)
        );
      })
    : [];

  useEffect(() => {
    if (!mention || nodes.length === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      const node = nodes[0];
      onPick(insertMention(text, cursor, mention.start, node.path));
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [mention, nodes, onPick, text, cursor]);

  if (!mention) return null;

  return (
    <ul className="writing-knowledge-at-menu" role="listbox">
      {nodes.length === 0 ? (
        <li className="writing-knowledge-at-empty">No matching files</li>
      ) : (
        nodes.map((node, index) => {
          const isFolder = node.type === 'dir';
          const parent = parentPath(node.path);
          return (
            <li key={node.path} role="option">
              <button
                type="button"
                className={`writing-knowledge-at-item${
                  index === 0 ? ' is-active' : ''
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(insertMention(text, cursor, mention.start, node.path));
                }}
              >
                <span
                  className={`writing-knowledge-icon ${
                    isFolder ? 'is-folder' : 'is-file'
                  }`}
                  aria-hidden
                >
                  {isFolder ? <Folder size={16} /> : <FileText size={16} />}
                </span>
                <span className="writing-knowledge-at-text">
                  <span className="writing-knowledge-at-name">
                    {node.name || node.path}
                  </span>
                  {parent ? (
                    <span className="writing-knowledge-at-path">{parent}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  );
}
