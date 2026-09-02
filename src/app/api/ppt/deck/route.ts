import { NextResponse } from 'next/server';
import { assignOutlineIds, parseOutline } from '@/lib/ppt/outline';
import { mergeStructuralPlans, parsePagePlan } from '@/lib/ppt/plan';
import { advanceBlockReason } from '@/lib/ppt/stage';
import { loadPptDeck, savePptDeck } from '@/lib/ppt/store';
import {
  emptyPptDeck,
  isPptStage,
  isPptThemeId,
  type PptAskQuestion,
  type PptBrief,
  type PptDeckState,
  type PptPagePlan,
} from '@/lib/ppt/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function userIdFrom(req: Request): string | null {
  return req.headers.get('x-user-id');
}

function chatIdFrom(req: Request, body?: { chatId?: unknown }): string {
  if (typeof body?.chatId === 'string' && body.chatId.trim()) {
    return body.chatId.trim();
  }
  const url = new URL(req.url);
  return (url.searchParams.get('chatId') || '').trim();
}

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const chatId = chatIdFrom(req);
  if (!chatId) {
    return NextResponse.json({ message: 'chatId is required' }, { status: 400 });
  }
  try {
    const deck = await loadPptDeck(chatId, userId);
    return NextResponse.json({ deck });
  } catch (error) {
    const status = (error as { status?: number }).status === 403 ? 403 : 500;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not load deck' },
      { status },
    );
  }
}

type DeckBody = {
  chatId?: string;
  stage?: string;
  brief?: PptBrief | null;
  questions?: PptAskQuestion[] | null;
  outline?: unknown;
  pages?: Record<string, unknown>;
  themeId?: string;
  selectedPageId?: string | null;
};

export async function PUT(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }

  let body: DeckBody;
  try {
    body = (await req.json()) as DeckBody;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const chatId = chatIdFrom(req, body);
  if (!chatId) {
    return NextResponse.json({ message: 'chatId is required' }, { status: 400 });
  }

  try {
    const current = await loadPptDeck(chatId, userId);
    const next: PptDeckState = { ...current };

    if (body.brief !== undefined) next.brief = body.brief;
    if (body.questions !== undefined) next.questions = body.questions;
    if (body.selectedPageId !== undefined) {
      next.selectedPageId = body.selectedPageId;
    }
    if (body.themeId !== undefined) {
      if (!isPptThemeId(body.themeId)) {
        return NextResponse.json({ message: 'Invalid themeId' }, { status: 400 });
      }
      next.themeId = body.themeId;
    }
    if (body.outline !== undefined) {
      if (body.outline === null) {
        next.outline = null;
      } else {
        const outline = assignOutlineIds(parseOutline(body.outline));
        next.outline = outline;
        next.pages = mergeStructuralPlans(outline, next.pages);
      }
    }
    if (body.pages && typeof body.pages === 'object') {
      const pages: Record<string, PptPagePlan> = { ...next.pages };
      for (const [id, raw] of Object.entries(body.pages)) {
        pages[id] = parsePagePlan(raw, { page_id: id });
      }
      next.pages = pages;
    }
    if (body.stage !== undefined && body.stage !== current.stage) {
      if (!isPptStage(body.stage)) {
        return NextResponse.json({ message: 'Invalid stage' }, { status: 400 });
      }
      const reason = advanceBlockReason(next, body.stage);
      if (reason) {
        return NextResponse.json({ message: reason }, { status: 400 });
      }
      next.stage = body.stage;
      if (body.stage !== 'discover') next.questions = null;
    }

    const deck = await savePptDeck(chatId, userId, next);
    return NextResponse.json({ deck });
  } catch (error) {
    const status = (error as { status?: number }).status === 403 ? 403 : 400;
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Could not save deck',
      },
      { status },
    );
  }
}

export { emptyPptDeck };
