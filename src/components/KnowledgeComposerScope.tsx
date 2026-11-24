'use client';

import { useChat } from '@/lib/hooks/useChat';
import { isKnowledgeFocusMode } from '@/lib/agents';
import { parseKnowledgePins, removeKnowledgePin } from '@/lib/knowledge/library';
import { isStructuredKnowledgeNode, nodeAtPath } from '@/lib/knowledge/tree';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import KnowledgeScopeChip from './KnowledgeScopeChip';

export default function KnowledgeComposerScope() {
  const {
    focusMode,
    knowledgeFolder,
    setKnowledgeFolder,
    pinCapMessage,
  } = useChat();
  const { privateTree, publicTree } = useKnowledgeTree();
  if (!isKnowledgeFocusMode(focusMode)) return null;
  const pins = parseKnowledgePins(knowledgeFolder);
  if (pins.length === 0 && !pinCapMessage) return null;
  return (
    <div className="knowledge-scope-chips">
      {pins.map((pin) => {
        const key = `${pin.library}:${pin.path}`;
        const tree = pin.library === 'public' ? publicTree : privateTree;
        const wiki = isStructuredKnowledgeNode(
          pin.path ? nodeAtPath(tree, pin.path) : null,
        );
        return (
          <KnowledgeScopeChip
            key={key}
            pin={key}
            wiki={wiki}
            onClear={() => setKnowledgeFolder(removeKnowledgePin(knowledgeFolder, key))}
          />
        );
      })}
      {pinCapMessage ? (
        <p className="knowledge-scope-cap" role="status">
          {pinCapMessage}
        </p>
      ) : null}
    </div>
  );
}
