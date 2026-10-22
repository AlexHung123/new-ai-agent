/** Loaded canvas HTML wins. Otherwise the database page is used. */
export function resolveAgentHtmlSnapshot(input: {
  html: unknown;
  htmlReady: unknown;
  pageHtml: string | null;
}): { html: string } {
  if (input.htmlReady === true && typeof input.html === 'string') {
    return { html: input.html };
  }
  if (input.pageHtml != null) return { html: input.pageHtml };
  return { html: '' };
}
