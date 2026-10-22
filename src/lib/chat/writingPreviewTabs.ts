export type PreviewTab = {
  id: string;
  label: string;
  kind: 'file' | 'html';
  fileId?: string;
  pageId?: string;
};

export function writingFileTabId(fileId: string): string {
  return `file:${fileId}`;
}

export function htmlPageTabId(pageId: string): string {
  return `html:${pageId}`;
}

/** Same rule as pi-web `openFileTab`: one tab per document, append when new. */
export function openPreviewTab(tabs: PreviewTab[], tab: PreviewTab): PreviewTab[] {
  const existing = tabs.find((item) => item.id === tab.id);
  if (!existing) return [...tabs, tab];
  if (
    existing.label === tab.label &&
    existing.kind === tab.kind &&
    existing.fileId === tab.fileId &&
    existing.pageId === tab.pageId
  ) {
    return tabs;
  }
  return tabs.map((item) => (item.id === tab.id ? { ...item, ...tab } : item));
}

export function closePreviewTab(tabs: PreviewTab[], tabId: string): PreviewTab[] {
  return tabs.filter((tab) => tab.id !== tabId);
}

/** pi-web activates the last remaining tab when the active one closes. */
export function activeTabAfterClose(
  tabs: PreviewTab[],
  closedId: string,
  currentId: string | null,
): string | null {
  if (currentId !== closedId) return currentId;
  const remaining = tabs.filter((tab) => tab.id !== closedId);
  return remaining.at(-1)?.id ?? null;
}

export function shouldHidePanel(tabs: PreviewTab[]): boolean {
  return tabs.length === 0;
}
