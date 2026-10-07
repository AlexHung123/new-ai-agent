export const HTML_SKILL_HEADING = '[HTML explainer skill]';

const HTML_TURN_PREFIX_RE =
  /^\[(?:HTML explainer skill|HTML mode|Plain text)\][\s\S]*?\n\n/;

export function stripHtmlTurnPrefixFromUserText(text: string): string {
  return text.replace(HTML_TURN_PREFIX_RE, '');
}

function stripHtmlTurnPrefixFromContent(content: unknown): unknown {
  if (typeof content === 'string') {
    return stripHtmlTurnPrefixFromUserText(content);
  }
  if (!Array.isArray(content)) return content;
  let stripped = false;
  const next = content.map((block) => {
    if (stripped || !block || typeof block !== 'object') return block;
    const rec = block as { type?: unknown; text?: unknown };
    if (rec.type !== 'text' || typeof rec.text !== 'string') return block;
    const text = stripHtmlTurnPrefixFromUserText(rec.text);
    if (text === rec.text) return block;
    stripped = true;
    return { ...rec, text };
  });
  return stripped ? next : content;
}

export function stripHtmlTurnPrefixesFromMessages(
  messages: unknown[],
): unknown[] {
  return messages.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const msg = raw as { role?: unknown; content?: unknown };
    if (String(msg.role || '') !== 'user') return raw;
    const next = stripHtmlTurnPrefixFromContent(msg.content);
    if (next === msg.content) return raw;
    return { ...msg, content: next };
  });
}
