import type { CardRole, CardSpan, PptLayoutId } from './layouts';

export const PPT_STAGES = [
  'discover',
  'outline',
  'plan',
  'design',
  'export',
] as const;

export type PptStage = (typeof PPT_STAGES)[number];

export const PPT_THEMES = ['navy-bento', 'slate-paper', 'forest-board'] as const;

export type PptThemeId = (typeof PPT_THEMES)[number];

export type PptBrief = {
  audience: string;
  purpose: string;
  pages: number;
  style: string;
  defaultsApplied: boolean;
};

export type PptAskQuestion = {
  id: string;
  prompt: string;
  placeholder?: string;
};

export type PptOutlinePage = {
  page_id: string;
  title: string;
  content?: string[];
};

export type PptOutlinePart = {
  part_id: string;
  part_title: string;
  pages: PptOutlinePage[];
};

export type PptOutline = {
  cover: { title: string; sub_title: string };
  table_of_contents: { title: string; content: string[] };
  parts: PptOutlinePart[];
  end_page: { title: string; sub_title?: string };
};

export type PptCard = {
  id: string;
  role: CardRole;
  title: string;
  body: string;
  span: CardSpan;
};

export type PptPageKind = 'cover' | 'toc' | 'section' | 'content' | 'end';

export type PptPagePlan = {
  page_id: string;
  title: string;
  intent: string;
  layout: PptLayoutId;
  kind: PptPageKind;
  cards: PptCard[];
  notes?: string;
};

export type PptDeckState = {
  stage: PptStage;
  brief: PptBrief | null;
  questions: PptAskQuestion[] | null;
  outline: PptOutline | null;
  pages: Record<string, PptPagePlan>;
  themeId: PptThemeId;
  selectedPageId: string | null;
  updatedAt: string;
};

export const PPT_TITLE_MAX = 40;
export const PPT_BODY_MAX = 80;
export const PPT_QUESTION_MAX = 5;
export const PPT_PAGES_MIN = 6;
export const PPT_PAGES_MAX = 16;

export function emptyPptDeck(): PptDeckState {
  return {
    stage: 'discover',
    brief: null,
    questions: null,
    outline: null,
    pages: {},
    themeId: 'navy-bento',
    selectedPageId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function isPptStage(value: unknown): value is PptStage {
  return typeof value === 'string' && (PPT_STAGES as readonly string[]).includes(value);
}

export function isPptThemeId(value: unknown): value is PptThemeId {
  return typeof value === 'string' && (PPT_THEMES as readonly string[]).includes(value);
}
