export const STOPPED_PLACEHOLDER = '(stopped)';

export function assistantContentAfterAbort(received: string): string {
  return received.trim() ? received : STOPPED_PLACEHOLDER;
}
