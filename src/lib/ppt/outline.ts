import type {
  PptDeckState,
  PptOutline,
  PptOutlinePage,
  PptOutlinePart,
  PptPageKind,
  PptPagePlan,
} from './types';

export type OutlinePageRef = {
  page_id: string;
  title: string;
  kind: PptPageKind;
  part_id?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item) => item.length > 0);
}

export function extractOutlinePayload(raw: unknown): unknown {
  if (typeof raw === 'string') {
    const wrapped = raw.match(/\[PPT_OUTLINE\]([\s\S]*?)\[\/PPT_OUTLINE\]/i);
    const text = (wrapped ? wrapped[1] : raw).trim();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Outline is not valid JSON');
    }
  }
  return raw;
}

function parsePage(raw: unknown, fallbackTitle: string): PptOutlinePage {
  const rec = asRecord(raw) ?? {};
  return {
    page_id: asString(rec.page_id),
    title: asString(rec.title, fallbackTitle) || fallbackTitle,
    content: asStringList(rec.content),
  };
}

function parsePart(raw: unknown, index: number): PptOutlinePart {
  const rec = asRecord(raw) ?? {};
  const partTitle =
    asString(rec.part_title) || asString(rec.title) || `第 ${index + 1} 部分`;
  const pagesRaw = Array.isArray(rec.pages) ? rec.pages : [];
  const pages =
    pagesRaw.length > 0
      ? pagesRaw.map((page, i) => parsePage(page, `${partTitle} · ${i + 1}`))
      : [{ page_id: '', title: partTitle, content: [] }];
  return {
    part_id: asString(rec.part_id) || `part-${String(index + 1).padStart(2, '0')}`,
    part_title: partTitle,
    pages,
  };
}

export function parseOutline(raw: unknown): PptOutline {
  const payload = extractOutlinePayload(raw);
  const root = asRecord(payload);
  const inner = asRecord(root?.ppt_outline) ?? asRecord(root?.outline) ?? root;
  if (!inner) throw new Error('Outline must be an object');

  const coverRec = asRecord(inner.cover) ?? {};
  const tocRec = asRecord(inner.table_of_contents) ?? {};
  const endRec = asRecord(inner.end_page) ?? {};
  const partsRaw = Array.isArray(inner.parts) ? inner.parts : [];
  const parts = partsRaw.map((part, i) => parsePart(part, i));
  if (parts.length === 0) {
    throw new Error('Outline needs at least one part');
  }

  const coverTitle = asString(coverRec.title) || '未命名演示';
  const tocItems =
    asStringList(tocRec.content).length > 0
      ? asStringList(tocRec.content)
      : parts.map((part) => part.part_title);

  return {
    cover: {
      title: coverTitle,
      sub_title: asString(coverRec.sub_title) || asString(coverRec.subtitle),
    },
    table_of_contents: {
      title: asString(tocRec.title) || '目录',
      content: tocItems,
    },
    parts,
    end_page: {
      title: asString(endRec.title) || '谢谢',
      sub_title: asString(endRec.sub_title) || asString(endRec.subtitle),
    },
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function assignOutlineIds(outline: PptOutline): PptOutline {
  let contentSeq = 0;
  const parts = outline.parts.map((part, i) => ({
    ...part,
    part_id: part.part_id || `part-${pad(i + 1)}`,
    pages: part.pages.map((page) => {
      contentSeq += 1;
      return {
        ...page,
        page_id: page.page_id || `p-${pad(contentSeq)}`,
      };
    }),
  }));
  return { ...outline, parts };
}

export function listOutlinePages(outline: PptOutline): OutlinePageRef[] {
  const pages: OutlinePageRef[] = [
    { page_id: 'p-cover', title: outline.cover.title, kind: 'cover' },
    { page_id: 'p-toc', title: outline.table_of_contents.title, kind: 'toc' },
  ];
  outline.parts.forEach((part, i) => {
    pages.push({
      page_id: `p-s-${pad(i + 1)}`,
      title: part.part_title,
      kind: 'section',
      part_id: part.part_id,
    });
    for (const page of part.pages) {
      pages.push({
        page_id: page.page_id,
        title: page.title,
        kind: 'content',
        part_id: part.part_id,
      });
    }
  });
  pages.push({
    page_id: 'p-end',
    title: outline.end_page.title,
    kind: 'end',
  });
  return pages;
}

export function contentPageCount(outline: PptOutline): number {
  return outline.parts.reduce((sum, part) => sum + part.pages.length, 0);
}

export function listDeckPlans(
  deck: Pick<PptDeckState, 'outline' | 'pages'>,
): PptPagePlan[] {
  if (deck.outline) {
    return listOutlinePages(deck.outline)
      .map((ref) => deck.pages[ref.page_id])
      .filter((plan): plan is PptPagePlan => Boolean(plan));
  }
  return Object.values(deck.pages);
}

export function replaceOutlinePages(
  outline: PptOutline,
  nextPages: Array<{ page_id: string; title: string; part_id?: string }>,
): PptOutline {
  const byPart = new Map<string, PptOutlinePage[]>();
  const partOrder: string[] = [];
  const partTitle = new Map(
    outline.parts.map((part) => [part.part_id, part.part_title]),
  );

  for (const page of nextPages) {
    if (!page.part_id) continue;
    if (!byPart.has(page.part_id)) {
      byPart.set(page.part_id, []);
      partOrder.push(page.part_id);
    }
    byPart.get(page.part_id)!.push({
      page_id: page.page_id,
      title: page.title,
      content: [],
    });
  }

  const parts: PptOutlinePart[] = partOrder.map((part_id, i) => ({
    part_id,
    part_title: partTitle.get(part_id) || `第 ${i + 1} 部分`,
    pages: byPart.get(part_id) || [],
  }));

  if (parts.length === 0) {
    throw new Error('At least one part with pages is required');
  }

  return assignOutlineIds({
    ...outline,
    parts,
    table_of_contents: {
      ...outline.table_of_contents,
      content: parts.map((part) => part.part_title),
    },
  });
}
