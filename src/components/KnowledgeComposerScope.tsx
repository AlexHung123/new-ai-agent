'use client';

import { useChat } from '@/lib/hooks/useChat';
import { isKnowledgeFocusMode } from '@/lib/agents';
import { parseKnowledgePin } from '@/lib/knowledge/library';
import { nodeAtPath } from '@/lib/knowledge/tree';
import { useKnowledgeTree } from '@/lib/knowledge/useKnowledgeTree';
import KnowledgeScopeChip from './KnowledgeScopeChip';

export default function KnowledgeComposerScope() {
  const { focusMode, knowledgeFolder, setKnowledgeFolder } = useChat();
  const { privateTree, publicTree } = useKnowledgeTree();
  if (!isKnowledgeFocusMode(focusMode)) return null;
  const pin = parseKnowledgePin(knowledgeFolder);
  const tree =
    pin?.library === 'public'
      ? publicTree
      : privateTree;
  const wiki = Boolean(pin?.path && nodeAtPath(tree, pin.path)?.wiki);
  return (
    <KnowledgeScopeChip
      pin={knowledgeFolder}
      wiki={wiki}
      onClear={() => setKnowledgeFolder('')}
    />
  );
}
