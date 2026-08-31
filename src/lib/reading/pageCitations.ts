export type PageCitation = {
  page: number;
  start: number;
  end: number;
  text: string;
};

const PAGE_CITE_RE =
  /\b(?:p|pp)\.\s*(\d{1,4})\b|\bpage\s+(\d{1,4})\b|\(page\s+(\d{1,4})\)|第\s*(\d{1,4})\s*頁|第\s*(\d{1,4})\s*页/gi;

function pageFromMatch(match: RegExpExecArray): number | null {
  for (let i = 1; i < match.length; i++) {
    const raw = match[i];
    if (!raw) continue;
    const page = Number(raw);
    if (Number.isFinite(page) && page >= 1) return page;
  }
  return null;
}

function insideFence(text: string, index: number): boolean {
  const before = text.slice(0, index);
  const ticks = before.split('```').length - 1;
  return ticks % 2 === 1;
}

export function findPageCitations(text: string): PageCitation[] {
  if (!text) return [];
  const found: PageCitation[] = [];
  const re = new RegExp(PAGE_CITE_RE.source, PAGE_CITE_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index == null) continue;
    if (insideFence(text, match.index)) continue;
    const page = pageFromMatch(match);
    if (!page) continue;
    found.push({
      page,
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }
  return found;
}

/** Wrap citations in `<pageref page="N">…</pageref>` for markdown-to-jsx. */
export function injectPageCiteMarkup(markdown: string): string {
  const cites = findPageCitations(markdown);
  if (cites.length === 0) return markdown;
  let out = '';
  let cursor = 0;
  for (const cite of cites) {
    out += markdown.slice(cursor, cite.start);
    out += `<pageref page="${cite.page}">${cite.text}</pageref>`;
    cursor = cite.end;
  }
  out += markdown.slice(cursor);
  return out;
}
