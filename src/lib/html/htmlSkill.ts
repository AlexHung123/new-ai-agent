import { HTML_MODE_TURN_PREFIX } from './htmlModePrompt';

export const HTML_SKILL_HEADING = '[HTML explainer skill]';

export const HTML_SKILL_PROMPT = `${HTML_SKILL_HEADING}
This skill is active because the user tagged HTML for this turn.
${HTML_MODE_TURN_PREFIX}`;

const HTML_TURN_PREFIX_RE =
  /^\[(?:HTML explainer skill|HTML mode|Plain text)\][\s\S]*?\n\n/;

export function withHtmlSkillSystemPrompt(systemPrompt: string): string {
  if (systemPrompt.includes(HTML_SKILL_HEADING)) return systemPrompt;
  const base = systemPrompt.trimEnd();
  return base ? `${base}\n\n${HTML_SKILL_PROMPT}` : HTML_SKILL_PROMPT;
}

export function stripHtmlTurnPrefixFromUserText(text: string): string {
  return text.replace(HTML_TURN_PREFIX_RE, '');
}

export function stripHtmlTurnPrefixesFromMessages(
  messages: unknown[],
): unknown[] {
  return messages.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const msg = raw as { role?: unknown; content?: unknown };
    if (String(msg.role || '') !== 'user') return raw;
    if (typeof msg.content !== 'string') return raw;
    const next = stripHtmlTurnPrefixFromUserText(msg.content);
    if (next === msg.content) return raw;
    return { ...msg, content: next };
  });
}
