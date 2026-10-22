export const RIGHT_PANEL_FOCUS_MODES = ['agentHtml', 'agentWriting'] as const;

export const RIGHT_PANEL_MIN_WIDTH = 300;
export const RIGHT_PANEL_MAX_WIDTH = 1200;
export const RIGHT_PANEL_DEFAULT_WIDTH = 560;
export const RIGHT_PANEL_CHAT_MIN_WIDTH = 420;
export const RIGHT_PANEL_WIDTH_STORAGE_KEY = 'ai-right-panel-width';
export const RIGHT_PANEL_OPEN_STORAGE_KEY = 'ai-right-panel-open';

export function usesRightPanel(focusMode: string | null | undefined): boolean {
  return focusMode === 'agentHtml' || focusMode === 'agentWriting';
}

export function defaultRightPanelOpen(
  focusMode: string | null | undefined,
): boolean {
  return focusMode === 'agentHtml';
}

export function clampRightPanelWidth(
  width: number,
  viewportWidth: number,
): number {
  const room = Math.max(
    RIGHT_PANEL_MIN_WIDTH,
    viewportWidth - RIGHT_PANEL_CHAT_MIN_WIDTH,
  );
  const max = Math.min(RIGHT_PANEL_MAX_WIDTH, room);
  const n = Number.isFinite(width) ? width : RIGHT_PANEL_DEFAULT_WIDTH;
  return Math.round(Math.max(RIGHT_PANEL_MIN_WIDTH, Math.min(max, n)));
}

export function defaultRightPanelWidth(viewportWidth: number): number {
  return clampRightPanelWidth(viewportWidth / 3, viewportWidth);
}
