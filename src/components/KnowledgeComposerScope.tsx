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
  const knowledgeMode = isKnowledgeFocusMode(focusMode);
  const pins = parseKnowledgePins(knowledgeFolder);
  const pinLibraries = Array.from(new Set(pins.map((pin) => pin.library)));
  const { privateTree, publicTree } = useKnowledgeTree({
    enabled: knowledgeMode && pins.length > 0,
    library: pinLibraries.length === 1 ? pinLibraries[0] : undefined,
  });
  if (!knowledgeMode) return null;
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
