'use client';

import { useEffect } from 'react';
import { FileText, Folder, Globe, Lock } from 'lucide-react';
import { knowledgeFolderDisplayName } from '@/lib/knowledge/folderDisplayName';
import {
  knowledgeMentionMatches,
  knowledgeMentionToken,
  type KnowledgeLibrary,
} from '@/lib/knowledge/library';
import {
  flattenVisibleKnowledgeNodes,
  isStructuredKnowledgeNode,
} from '@/lib/knowledge/tree';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import { atQueryAtCursor, insertMention } from '@/lib/writing/mentions';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';

type Props = {
  text: string;
  cursor: number;
  onPick: (next: { text: string; cursor: number }) => void;
};

function parentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.slice(0, -1).join('/');
}

function listedNodes(
  tree: KnowledgeTreeNode,
  library: KnowledgeLibrary,
  query: string,
) {
  return flattenVisibleKnowledgeNodes(tree)
    .filter((node) => node.path)
    .map((node) => ({
      ...node,
      library,
      token: knowledgeMentionToken({ library, path: node.path }),
    }))
    .filter((node) =>
      knowledgeMentionMatches({
        name: knowledgeFolderDisplayName(node.path, node.name),
        path: node.path,
        library,
        query,
      }),
    );
}

export default function WritingKnowledgeAtMenu({
  text,
  cursor,
  onPick,
}: Props) {
  const mention = atQueryAtCursor(text, cursor);
  const { privateTree, publicTree, loading } = useKnowledgeTree({
    enabled: Boolean(mention),
  });
  const query = mention?.query.toLowerCase() ?? '';
  const nodes = mention
    ? [
        ...listedNodes(privateTree, 'private', query),
        ...listedNodes(publicTree, 'public', query),
      ]
    : [];

  useEffect(() => {
    if (!mention || nodes.length === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      const node = nodes[0];
      onPick(insertMention(text, cursor, mention.start, node.token));
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [mention, nodes, onPick, text, cursor]);

  if (!mention) return null;

  return (
    <ul className="writing-knowledge-at-menu" role="listbox">
      {loading && nodes.length === 0 ? (
        <li className="writing-knowledge-at-empty">Loading files…</li>
      ) : nodes.length === 0 ? (
        <li className="writing-knowledge-at-empty">No matching files</li>
      ) : (
        nodes.map((node, index) => {
          const structured = isStructuredKnowledgeNode(node);
          const isFolder = node.type === 'dir' && !structured;
          const parent = parentPath(node.path);
          const isPublic = node.library === 'public';
          return (
            <li key={`${node.library}:${node.path}`} role="option">
              <button
                type="button"
                className={`writing-knowledge-at-item${index === 0 ? ' is-active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(
                    insertMention(text, cursor, mention.start, node.token),
                  );
                }}
              >
                <span
                  className={`writing-knowledge-icon ${isFolder ? 'is-folder' : 'is-file'}`}
                  aria-hidden
                >
                  {isFolder ? <Folder size={16} /> : <FileText size={16} />}
                </span>
                <span className="writing-knowledge-at-text">
                  <span className="writing-knowledge-at-name">
                    {knowledgeFolderDisplayName(node.path, node.name) ||
                      node.path}
                    {structured ? (
                      <span className="writing-knowledge-wiki-badge">
                        Structured
                      </span>
                    ) : null}
                  </span>
                  <span className="writing-knowledge-at-path">
                    {isPublic ? 'Public' : 'Private'}
                    {parent ? ` · ${parent}` : ''}
                  </span>
                </span>
                <span
                  className={`writing-knowledge-at-scope is-${node.library}`}
                  aria-label={isPublic ? 'Public' : 'Private'}
                >
                  {isPublic ? <Globe size={12} /> : <Lock size={12} />}
                </span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  );
}
