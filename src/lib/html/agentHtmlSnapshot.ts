export function resolveAgentHtmlSnapshot(input: {
  html: unknown;
  htmlReady: unknown;
  working: string | null;
  pageHtml: string | null;
}): { html: string; persist: 'client' | 'page' | 'none' } {
  if (input.htmlReady === true && typeof input.html === 'string') {
    return { html: input.html, persist: 'client' };
  }
  if (input.working != null) return { html: input.working, persist: 'none' };
  if (input.pageHtml != null) return { html: input.pageHtml, persist: 'page' };
  return { html: '', persist: 'none' };
}
