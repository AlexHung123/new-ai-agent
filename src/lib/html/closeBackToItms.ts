export const AGENT_HTML_CLOSE_TYPE = 'agent-html-close';

export type CloseBackResult = 'posted' | 'back' | 'close';

export function closeBackToItms(input: {
  embedded: boolean;
  historyLength: number;
  post: (message: unknown) => void;
  back: () => void;
  closeWindow: () => void;
}): CloseBackResult {
  if (input.embedded) {
    input.post({ type: AGENT_HTML_CLOSE_TYPE });
    return 'posted';
  }
  if (input.historyLength > 1) {
    input.back();
    return 'back';
  }
  input.closeWindow();
  return 'close';
}
