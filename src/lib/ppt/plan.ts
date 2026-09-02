import {
  LAYOUT_SPECS,
  isPptLayoutId,
  layoutCardBounds,
  type CardRole,
  type CardSpan,
  type PptLayoutId,
} from './layouts';
import {
  PPT_BODY_MAX,
  PPT_TITLE_MAX,
  type PptCard,
  type PptOutline,
  type PptPageKind,
  type PptPagePlan,
} from './types';
import { listOutlinePages } from './outline';

const ROLES: readonly CardRole[] = [
  'hero',
  'body',
  'stat',
  'quote',
  'step',
  'meta',
];
const SPANS: readonly CardSpan[] = ['full', '1/2', '1/3', '2/3', '1/4'];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

function parseRole(value: unknown, fallback: CardRole): CardRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
    ? (value as CardRole)
    : fallback;
}

function parseSpan(value: unknown, fallback: CardSpan): CardSpan {
  return typeof value === 'string' && (SPANS as readonly string[]).includes(value)
    ? (value as CardSpan)
    : fallback;
}

export function parsePagePlan(
  raw: unknown,
  fallback?: { page_id?: string; kind?: PptPageKind; title?: string },
): PptPagePlan {
  const rec = asRecord(raw);
  if (!rec) throw new Error('Page plan must be an object');

  const layoutRaw = rec.layout;
  if (!isPptLayoutId(layoutRaw)) {
    throw new Error('layout must be one of the locked layout enums');
  }
  const layout: PptLayoutId = layoutRaw;
  const spec = LAYOUT_SPECS[layout];
  const bounds = layoutCardBounds(layout);
  const cardsRaw = Array.isArray(rec.cards) ? rec.cards : [];
  if (cardsRaw.length < bounds.min || cardsRaw.length > bounds.max) {
    throw new Error(
      `${layout} needs ${bounds.min}${bounds.min === bounds.max ? '' : `–${bounds.max}`} cards`,
    );
  }

  const cards: PptCard[] = cardsRaw.map((item, i) => {
    const card = asRecord(item) ?? {};
    const slot = spec.slots[Math.min(i, spec.slots.length - 1)]!;
    return {
      id: typeof card.id === 'string' && card.id.trim() ? card.id.trim() : slot.id,
      role: parseRole(card.role, slot.role),
      span: parseSpan(card.span, slot.span),
      title: clip(
        typeof card.title === 'string' ? card.title : '',
        PPT_TITLE_MAX,
      ),
      body: clip(typeof card.body === 'string' ? card.body : '', PPT_BODY_MAX),
    };
  });

  const kind =
    rec.kind === 'cover' ||
    rec.kind === 'toc' ||
    rec.kind === 'section' ||
    rec.kind === 'content' ||
    rec.kind === 'end'
      ? rec.kind
      : fallback?.kind ?? 'content';

  return {
    page_id:
      (typeof rec.page_id === 'string' && rec.page_id.trim()) ||
      fallback?.page_id ||
      '',
    title:
      clip(typeof rec.title === 'string' ? rec.title : '', PPT_TITLE_MAX) ||
      fallback?.title ||
      '',
    intent: clip(typeof rec.intent === 'string' ? rec.intent : '', 80),
    layout,
    kind,
    cards,
    notes:
      typeof rec.notes === 'string' && rec.notes.trim()
        ? rec.notes.trim().slice(0, 200)
        : undefined,
  };
}

export function structuralPlans(outline: PptOutline): Record<string, PptPagePlan> {
  const pages: Record<string, PptPagePlan> = {};
  const refs = listOutlinePages(outline);
  const parts = outline.parts;

  for (const ref of refs) {
    if (ref.kind === 'cover') {
      pages[ref.page_id] = {
        page_id: ref.page_id,
        title: outline.cover.title,
        intent: '封面',
        layout: 'cover',
        kind: 'cover',
        cards: [
          {
            id: 'c1',
            role: 'hero',
            span: 'full',
            title: outline.cover.title,
            body: outline.cover.sub_title,
          },
        ],
      };
    } else if (ref.kind === 'toc') {
      const items = outline.table_of_contents.content.slice(0, 5);
      const cards = items.map((title, i) => ({
        id: `c${i + 1}`,
        role: 'step' as const,
        span: 'full' as const,
        title,
        body: '',
      }));
      while (cards.length < 3) {
        cards.push({
          id: `c${cards.length + 1}`,
          role: 'step',
          span: 'full',
          title: '',
          body: '',
        });
      }
      pages[ref.page_id] = {
        page_id: ref.page_id,
        title: outline.table_of_contents.title,
        intent: '目录',
        layout: 'toc',
        kind: 'toc',
        cards,
      };
    } else if (ref.kind === 'section') {
      const idx = refs.filter((p) => p.kind === 'section').indexOf(ref);
      const part = parts[idx];
      pages[ref.page_id] = {
        page_id: ref.page_id,
        title: ref.title,
        intent: '章节页',
        layout: 'section',
        kind: 'section',
        cards: [
          {
            id: 'c1',
            role: 'hero',
            span: 'full',
            title: ref.title,
            body: part?.pages[0]?.title ?? '',
          },
        ],
      };
    } else if (ref.kind === 'end') {
      pages[ref.page_id] = {
        page_id: ref.page_id,
        title: outline.end_page.title,
        intent: '结束页',
        layout: 'cover',
        kind: 'end',
        cards: [
          {
            id: 'c1',
            role: 'hero',
            span: 'full',
            title: outline.end_page.title,
            body: outline.end_page.sub_title || '欢迎提问',
          },
        ],
      };
    }
  }
  return pages;
}

export function mergeStructuralPlans(
  outline: PptOutline,
  existing: Record<string, PptPagePlan>,
): Record<string, PptPagePlan> {
  const next = { ...existing };
  const generated = structuralPlans(outline);
  for (const [id, plan] of Object.entries(generated)) {
    if (!next[id]) next[id] = plan;
  }
  const live = new Set(listOutlinePages(outline).map((p) => p.page_id));
  for (const id of Object.keys(next)) {
    if (!live.has(id)) delete next[id];
  }
  return next;
}
