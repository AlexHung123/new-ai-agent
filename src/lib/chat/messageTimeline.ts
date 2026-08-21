export type TimelineMessage = {
  role: string;
  messageId: string;
  content: string;
};

export type TimelineTurn = {
  index: number;
  userMessageId: string;
  userPreview: string;
  assistantPreview: string;
};

const ACCURACY_DISCLAIMER = 'AI生成的回覆可能不準確，使用前請仔細核實。';

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripPreviewMarkup(text: string): string {
  return stripHtml(text || '')
    .replace(ACCURACY_DISCLAIMER, '')
    .replace(/\r\n/g, '\n')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '');
}

function collapsePreview(text: string, max = 160): string {
  const flat = stripPreviewMarkup(text)
    .replace(/\n+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

function collapseAssistantPreview(text: string, max = 200): string {
  const lines = stripPreviewMarkup(text)
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  let out = lines.slice(0, 5).join('\n');
  if (out.length > max) out = `${out.slice(0, max - 1).trimEnd()}…`;
  return out;
}

export function buildTimelineTurns(messages: TimelineMessage[]): TimelineTurn[] {
  const turns: TimelineTurn[] = [];
  let pendingUser: TimelineMessage | null = null;

  const flush = (assistant?: TimelineMessage) => {
    if (!pendingUser) return;
    turns.push({
      index: turns.length + 1,
      userMessageId: pendingUser.messageId,
      userPreview: collapsePreview(pendingUser.content, 100) || '(empty message)',
      assistantPreview: assistant
        ? collapseAssistantPreview(assistant.content, 220) || '…'
        : '',
    });
    pendingUser = null;
  };

  for (const m of messages) {
    if (m.role === 'user') {
      flush();
      pendingUser = m;
    } else if (m.role === 'assistant') {
      if (pendingUser) {
        flush(m);
      }
    }
  }
  flush();
  return turns;
}
