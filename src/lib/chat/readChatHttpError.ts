export function messageFromChatHttpError(
  bodyText: string,
  status: number,
): string {
  const trimmed = (bodyText || '').trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { message?: unknown };
      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      return `Request failed (${status})`;
    }
  }
  if (trimmed) return trimmed.slice(0, 300);
  return `Request failed (${status})`;
}
