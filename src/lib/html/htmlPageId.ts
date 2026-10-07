export function isHtmlPageId(pageId: string): boolean {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(pageId);
}
