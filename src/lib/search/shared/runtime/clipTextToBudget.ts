/**
 * Head+tail clip for a single oversized text blob (tool results).
 * maxChars <= 0 means no truncation.
 */
export function clipTextToBudget(text: string, maxChars: number): string {
  const t = text || '';
  if (maxChars <= 0 || t.length <= maxChars) return t;
  if (maxChars < 64) return `${t.slice(0, maxChars)}…`;
  const marker = '\n\n…[truncated to fit context budget]…\n\n';
  const budget = maxChars - marker.length;
  const head = Math.floor(budget * 0.6);
  const tail = Math.max(0, budget - head);
  return `${t.slice(0, head)}${marker}${t.slice(t.length - tail)}`;
}
