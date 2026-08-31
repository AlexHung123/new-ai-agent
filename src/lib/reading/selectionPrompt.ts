import { MAX_READING_QUOTE_CHARS, type ReaderSelection } from './types';

export const SELECTED_TEXT_PREFIX = 'Selected text from';

export function clipReaderQuote(quote: string): string {
  const trimmed = quote.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= MAX_READING_QUOTE_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_READING_QUOTE_CHARS)}…`;
}

export function formatReaderUserMessage(
  question: string,
  selection?: ReaderSelection | null,
): string {
  const q = question.trim();
  if (!selection?.quote.trim()) return q;
  if (q.startsWith(SELECTED_TEXT_PREFIX)) return q;

  const name = (selection.fileName || 'PDF').trim() || 'PDF';
  const quote = clipReaderQuote(selection.quote);
  const quoted = quote
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
  const body = q || 'Explain this passage.';
  return `${SELECTED_TEXT_PREFIX} ${name} (page ${selection.page}):\n${quoted}\n\n${body}`;
}
