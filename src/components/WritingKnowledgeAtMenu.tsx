'use client';

import { useEffect } from 'react';
import { flattenKnowledgeNodes } from '@/lib/knowledge/tree';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import { atQueryAtCursor, insertMention } from '@/lib/writing/mentions';

type Props = {
  text: string;
  cursor: number;
  onPick: (next: { text: string; cursor: number }) => void;
};

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
        nodes.map((node) => (
          <li key={node.path} role="option">
            <button
              type="button"
              className="writing-knowledge-at-item"
              onMouseDown={(event) => {
                event.preventDefault();
                onPick(insertMention(text, cursor, mention.start, node.path));
              }}
            >
              <span className="writing-knowledge-at-kind">
                {node.type === 'dir' ? 'Folder' : 'File'}
              </span>
              <span className="writing-knowledge-at-path">{node.path}</span>
            </button>
          </li>
        ))
      )}
    </ul>
  );
}
