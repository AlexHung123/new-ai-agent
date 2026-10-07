'use client';

import { useChat } from '@/lib/hooks/useChat';

export const HTML_SKILL_HINT =
  'Ask for a visual explainer, a flow, or a diagram. e.g. “Make an HTML explainer of this process” / 「幫我做一頁流程說明」';

export function HtmlSkillHint() {
  const { focusMode } = useChat();
  if (focusMode !== 'agentWriting' && focusMode !== 'agentDocument') {
    return null;
  }
  return (
    <span
      className="writing-tool-btn html-skill-hint"
      title={HTML_SKILL_HINT}
      aria-label={HTML_SKILL_HINT}
      tabIndex={0}
    >
      HTML
    </span>
  );
}
