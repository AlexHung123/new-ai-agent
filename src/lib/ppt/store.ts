import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { pptDecks } from '@/lib/db/schema';
import {
  emptyPptDeck,
  isPptStage,
  isPptThemeId,
  type PptAskQuestion,
  type PptBrief,
  type PptDeckState,
  type PptPagePlan,
  type PptStage,
  type PptThemeId,
} from './types';
import type { PptOutline } from './types';

function asDeck(value: unknown): PptDeckState {
  const base = emptyPptDeck();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  const rec = value as Partial<PptDeckState>;
  return {
    stage: isPptStage(rec.stage) ? rec.stage : base.stage,
    brief: rec.brief && typeof rec.brief === 'object' ? rec.brief : null,
    questions: Array.isArray(rec.questions) ? rec.questions : null,
    outline: rec.outline && typeof rec.outline === 'object' ? rec.outline : null,
    pages:
      rec.pages && typeof rec.pages === 'object' && !Array.isArray(rec.pages)
        ? rec.pages
        : {},
    themeId: isPptThemeId(rec.themeId) ? rec.themeId : base.themeId,
    selectedPageId:
      typeof rec.selectedPageId === 'string' ? rec.selectedPageId : null,
    updatedAt:
      typeof rec.updatedAt === 'string' ? rec.updatedAt : base.updatedAt,
  };
}

export async function loadPptDeck(
  chatId: string,
  userId: string,
): Promise<PptDeckState> {
  const row = await db.query.pptDecks.findFirst({
    where: eq(pptDecks.chatId, chatId),
  });
  if (!row) return emptyPptDeck();
  if (row.userId !== userId) {
    throw Object.assign(new Error('Unauthorized access to deck'), {
      status: 403,
    });
  }
  return asDeck(row.deck);
}

export async function savePptDeck(
  chatId: string,
  userId: string,
  deck: PptDeckState,
): Promise<PptDeckState> {
  const next: PptDeckState = {
    ...deck,
    updatedAt: new Date().toISOString(),
  };
  const existing = await db.query.pptDecks.findFirst({
    where: eq(pptDecks.chatId, chatId),
  });
  if (existing && existing.userId !== userId) {
    throw Object.assign(new Error('Unauthorized access to deck'), {
      status: 403,
    });
  }
  if (existing) {
    await db
      .update(pptDecks)
      .set({
        userId,
        stage: next.stage,
        deck: next,
        updatedAt: next.updatedAt,
      })
      .where(eq(pptDecks.chatId, chatId));
  } else {
    await db.insert(pptDecks).values({
      chatId,
      userId,
      stage: next.stage,
      deck: next,
      updatedAt: next.updatedAt,
    });
  }
  return next;
}

export type PptDeckPatch = {
  stage?: PptStage;
  brief?: PptBrief | null;
  questions?: PptAskQuestion[] | null;
  outline?: PptOutline | null;
  pages?: Record<string, PptPagePlan>;
  themeId?: PptThemeId;
  selectedPageId?: string | null;
};

export async function patchPptDeck(
  chatId: string,
  userId: string,
  patch: PptDeckPatch,
): Promise<PptDeckState> {
  const current = await loadPptDeck(chatId, userId);
  return savePptDeck(chatId, userId, {
    ...current,
    ...patch,
    pages: patch.pages ?? current.pages,
  });
}
