'use client';

import { useChat } from '@/lib/hooks/useChat';

export function HtmlModeToggle() {
  const { focusMode, htmlMode, setHtmlMode } = useChat();
  if (focusMode !== 'agentWriting' && focusMode !== 'agentDocument') {
    return null;
  }
  return (
    <button
      type="button"
      className={`writing-tool-btn html-mode-btn${htmlMode ? ' is-on' : ''}`}
      aria-pressed={htmlMode}
      aria-label="HTML explainer page"
      title="Answer with an HTML explainer page"
      onClick={() => setHtmlMode(!htmlMode)}
    >
      HTML
    </button>
  );
}
