export const PPT_CANVAS = {
  width: 1280,
  height: 720,
  padding: 48,
  gap: 24,
  radius: 16,
  titleBar: 56,
} as const;

export const PPT_LAYOUTS = [
  'cover',
  'toc',
  'section',
  'hero',
  'two_sym',
  'two_asym',
  'three_col',
  'quad',
  'hero_plus_row',
  'timeline',
] as const;

export type PptLayoutId = (typeof PPT_LAYOUTS)[number];

export type CardRole = 'hero' | 'body' | 'stat' | 'quote' | 'step' | 'meta';

export type CardSpan = 'full' | '1/2' | '1/3' | '2/3' | '1/4';

export type LayoutCardSlot = {
  id: string;
  role: CardRole;
  span: CardSpan;
  gridColumn?: string;
};

export type LayoutSpec = {
  id: PptLayoutId;
  nameZh: string;
  cardCount: number;
  minCards?: number;
  maxCards?: number;
  cssGrid: string;
  hasTitleBar: boolean;
  slots: LayoutCardSlot[];
};

export const LAYOUT_SPECS: Record<PptLayoutId, LayoutSpec> = {
  cover: {
    id: 'cover',
    nameZh: '封面',
    cardCount: 1,
    cssGrid: '1fr / 1fr',
    hasTitleBar: false,
    slots: [{ id: 'c1', role: 'hero', span: 'full' }],
  },
  toc: {
    id: 'toc',
    nameZh: '目录',
    cardCount: 4,
    minCards: 3,
    maxCards: 5,
    cssGrid: 'repeat(4, 1fr) / 1fr',
    hasTitleBar: true,
    slots: [
      { id: 'c1', role: 'step', span: 'full' },
      { id: 'c2', role: 'step', span: 'full' },
      { id: 'c3', role: 'step', span: 'full' },
      { id: 'c4', role: 'step', span: 'full' },
    ],
  },
  section: {
    id: 'section',
    nameZh: '章节页',
    cardCount: 1,
    cssGrid: '1fr / 1fr',
    hasTitleBar: false,
    slots: [{ id: 'c1', role: 'hero', span: 'full' }],
  },
  hero: {
    id: 'hero',
    nameZh: '单焦点',
    cardCount: 1,
    cssGrid: '1fr / 1fr',
    hasTitleBar: true,
    slots: [{ id: 'c1', role: 'hero', span: 'full' }],
  },
  two_sym: {
    id: 'two_sym',
    nameZh: '对称双栏',
    cardCount: 2,
    cssGrid: '1fr / 1fr 1fr',
    hasTitleBar: true,
    slots: [
      { id: 'c1', role: 'body', span: '1/2' },
      { id: 'c2', role: 'body', span: '1/2' },
    ],
  },
  two_asym: {
    id: 'two_asym',
    nameZh: '主次双栏',
    cardCount: 2,
    cssGrid: '1fr / 2fr 1fr',
    hasTitleBar: true,
    slots: [
      { id: 'c1', role: 'hero', span: '2/3' },
      { id: 'c2', role: 'stat', span: '1/3' },
    ],
  },
  three_col: {
    id: 'three_col',
    nameZh: '三列',
    cardCount: 3,
    cssGrid: '1fr / 1fr 1fr 1fr',
    hasTitleBar: true,
    slots: [
      { id: 'c1', role: 'body', span: '1/3' },
      { id: 'c2', role: 'body', span: '1/3' },
      { id: 'c3', role: 'body', span: '1/3' },
    ],
  },
  quad: {
    id: 'quad',
    nameZh: '四宫格',
    cardCount: 4,
    cssGrid: '1fr 1fr / 1fr 1fr',
    hasTitleBar: true,
    slots: [
      { id: 'c1', role: 'body', span: '1/2' },
      { id: 'c2', role: 'body', span: '1/2' },
      { id: 'c3', role: 'body', span: '1/2' },
      { id: 'c4', role: 'body', span: '1/2' },
    ],
  },
  hero_plus_row: {
    id: 'hero_plus_row',
    nameZh: '上主下辅',
    cardCount: 4,
    cssGrid: '1.35fr 1fr / 1fr 1fr 1fr',
    hasTitleBar: true,
    slots: [
      { id: 'c1', role: 'hero', span: 'full', gridColumn: '1 / -1' },
      { id: 'c2', role: 'body', span: '1/3' },
      { id: 'c3', role: 'body', span: '1/3' },
      { id: 'c4', role: 'body', span: '1/3' },
    ],
  },
  timeline: {
    id: 'timeline',
    nameZh: '时间线',
    cardCount: 4,
    minCards: 3,
    maxCards: 5,
    cssGrid: '1fr / repeat(4, 1fr)',
    hasTitleBar: true,
    slots: [
      { id: 'c1', role: 'step', span: '1/4' },
      { id: 'c2', role: 'step', span: '1/4' },
      { id: 'c3', role: 'step', span: '1/4' },
      { id: 'c4', role: 'step', span: '1/4' },
    ],
  },
};

export function isPptLayoutId(value: unknown): value is PptLayoutId {
  return (
    typeof value === 'string' &&
    (PPT_LAYOUTS as readonly string[]).includes(value)
  );
}

export function layoutCardBounds(layout: PptLayoutId): {
  min: number;
  max: number;
} {
  const spec = LAYOUT_SPECS[layout];
  return {
    min: spec.minCards ?? spec.cardCount,
    max: spec.maxCards ?? spec.cardCount,
  };
}

export function gridTemplateForCount(
  layout: PptLayoutId,
  cardCount: number,
): string {
  if (layout === 'toc') return `repeat(${cardCount}, 1fr) / 1fr`;
  if (layout === 'timeline') return `1fr / repeat(${cardCount}, 1fr)`;
  return LAYOUT_SPECS[layout].cssGrid;
}
