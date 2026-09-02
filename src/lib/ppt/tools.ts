import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import { jsonToolResult } from '@/lib/search/shared/runtime/piToolResult';
import {
  PPT_PAGES_MAX,
  PPT_PAGES_MIN,
  PPT_QUESTION_MAX,
  emptyPptDeck,
  isPptStage,
  isPptThemeId,
  type PptAskQuestion,
  type PptBrief,
  type PptDeckState,
  type PptStage,
} from './types';
import { assignOutlineIds, parseOutline } from './outline';
import { mergeStructuralPlans, parsePagePlan } from './plan';
import {
  advanceBlockReason,
  nextStage,
  toolAllowedInStage,
} from './stage';
import { loadPptDeck, savePptDeck } from './store';
import { getPptTurnContext } from './pptTurnContext';

type ToolOk = { ok: true; summary: string; stage: PptStage; deck: PptDeckState };
type ToolErr = { ok: false; error: string; stage?: PptStage };

function fail(error: string, stage?: PptStage): ToolErr {
  return { ok: false, error, ...(stage ? { stage } : {}) };
}

async function withDeck(
  tool: string,
  mutate: (deck: PptDeckState) => Promise<PptDeckState | ToolErr> | PptDeckState | ToolErr,
): Promise<ToolOk | ToolErr> {
  const ctx = getPptTurnContext();
  if (!ctx?.chatId || !ctx.userId) {
    return fail('PPT turn context is missing');
  }
  const current = await loadPptDeck(ctx.chatId, ctx.userId);
  if (!toolAllowedInStage(tool, current.stage)) {
    return fail(`Tool ${tool} is not allowed in stage ${current.stage}`, current.stage);
  }
  const result = await mutate(current);
  if ('ok' in result && result.ok === false) return result;
  const saved = await savePptDeck(ctx.chatId, ctx.userId, result as PptDeckState);
  ctx.emit?.({ deck: saved });
  return {
    ok: true,
    summary: `${tool} · ${saved.stage}`,
    stage: saved.stage,
    deck: saved,
  };
}

function parseQuestions(raw: unknown): PptAskQuestion[] {
  if (!Array.isArray(raw)) throw new Error('questions must be an array');
  const questions: PptAskQuestion[] = [];
  for (let i = 0; i < raw.length && questions.length < PPT_QUESTION_MAX; i++) {
    const item = raw[i];
    const rec = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const prompt = typeof rec.prompt === 'string' ? rec.prompt.trim() : '';
    if (!prompt) continue;
    const question: PptAskQuestion = {
      id:
        typeof rec.id === 'string' && rec.id.trim()
          ? rec.id.trim()
          : `q${i + 1}`,
      prompt: prompt.slice(0, 80),
    };
    if (typeof rec.placeholder === 'string' && rec.placeholder.trim()) {
      question.placeholder = rec.placeholder.trim().slice(0, 80);
    }
    questions.push(question);
  }
  if (questions.length === 0) throw new Error('Ask 1–5 questions');
  return questions;
}

function parseBrief(raw: Record<string, unknown>): PptBrief {
  const pagesRaw = Number(raw.pages);
  const pages = Number.isFinite(pagesRaw)
    ? Math.min(PPT_PAGES_MAX, Math.max(PPT_PAGES_MIN, Math.round(pagesRaw)))
    : 10;
  return {
    audience: String(raw.audience || '内部同事').trim().slice(0, 80) || '内部同事',
    purpose: String(raw.purpose || '把主题讲清楚并促成下一步').trim().slice(0, 120),
    pages,
    style: String(raw.style || 'navy-bento 专业简洁').trim().slice(0, 80),
    defaultsApplied: raw.defaultsApplied === true,
  };
}

export function createPptTools(): AgentTool[] {
  return [
    {
      name: 'ask_user',
      label: 'Ask user',
      description:
        'Ask at most 5 clarifying questions as a form. Do not list the questions in chat.',
      parameters: Type.Object({
        questions: Type.Array(
          Type.Object({
            id: Type.Optional(Type.String()),
            prompt: Type.String(),
            placeholder: Type.Optional(Type.String()),
          }),
        ),
      }),
      execute: async (_id, args) => {
        try {
          const questions = parseQuestions(
            (args as { questions?: unknown }).questions,
          );
          return jsonToolResult(
            await withDeck('ask_user', (deck) => ({
              ...deck,
              questions,
            })),
          );
        } catch (error) {
          return jsonToolResult(
            fail(error instanceof Error ? error.message : String(error)),
          );
        }
      },
    },
    {
      name: 'commit_brief',
      label: 'Commit brief',
      description:
        'Save audience/purpose/pages/style and advance to outline. Use defaultsApplied if the user said to decide.',
      parameters: Type.Object({
        audience: Type.String(),
        purpose: Type.String(),
        pages: Type.Optional(Type.Number()),
        style: Type.Optional(Type.String()),
        defaultsApplied: Type.Optional(Type.Boolean()),
      }),
      execute: async (_id, args) =>
        jsonToolResult(
          await withDeck('commit_brief', (deck) => {
            const brief = parseBrief(args as Record<string, unknown>);
            return {
              ...deck,
              brief,
              questions: null,
              stage: 'outline',
            };
          }),
        ),
    },
    {
      name: 'commit_outline',
      label: 'Commit outline',
      description:
        'Save the sticky-note outline. Stay in outline until the user confirms. Wrap with [PPT_OUTLINE] or pass the object.',
      parameters: Type.Object({
        outline: Type.Unknown(),
      }),
      execute: async (_id, args) => {
        try {
          const outline = assignOutlineIds(
            parseOutline((args as { outline?: unknown }).outline),
          );
          return jsonToolResult(
            await withDeck('commit_outline', (deck) => ({
              ...deck,
              outline,
              pages: mergeStructuralPlans(outline, deck.pages),
              selectedPageId: deck.selectedPageId ?? 'p-cover',
            })),
          );
        } catch (error) {
          return jsonToolResult(
            fail(error instanceof Error ? error.message : String(error)),
          );
        }
      },
    },
    {
      name: 'patch_outline',
      label: 'Patch outline',
      description: 'Replace the outline after user sticky-note edits.',
      parameters: Type.Object({
        outline: Type.Unknown(),
      }),
      execute: async (_id, args) => {
        try {
          const outline = assignOutlineIds(
            parseOutline((args as { outline?: unknown }).outline),
          );
          return jsonToolResult(
            await withDeck('patch_outline', (deck) => ({
              ...deck,
              outline,
              pages: mergeStructuralPlans(outline, deck.pages),
            })),
          );
        } catch (error) {
          return jsonToolResult(
            fail(error instanceof Error ? error.message : String(error)),
          );
        }
      },
    },
    {
      name: 'commit_page_plan',
      label: 'Commit page plan',
      description:
        'Lock one page: layout enum + cards. No colors. Cards must match the layout count.',
      parameters: Type.Object({
        page_id: Type.String(),
        plan: Type.Unknown(),
      }),
      execute: async (_id, args) => {
        try {
          const pageId = String((args as { page_id?: unknown }).page_id || '').trim();
          if (!pageId) throw new Error('page_id is required');
          const plan = parsePagePlan((args as { plan?: unknown }).plan, {
            page_id: pageId,
          });
          plan.page_id = pageId;
          return jsonToolResult(
            await withDeck('commit_page_plan', (deck) => {
              if (!deck.outline) return fail('Outline is missing', deck.stage);
              return {
                ...deck,
                pages: { ...deck.pages, [pageId]: plan },
                selectedPageId: pageId,
              };
            }),
          );
        } catch (error) {
          return jsonToolResult(
            fail(error instanceof Error ? error.message : String(error)),
          );
        }
      },
    },
    {
      name: 'get_page_plan',
      label: 'Get page plan',
      description: 'Read one page plan by page_id.',
      parameters: Type.Object({
        page_id: Type.String(),
      }),
      execute: async (_id, args) => {
        const pageId = String((args as { page_id?: unknown }).page_id || '').trim();
        return jsonToolResult(
          await withDeck('get_page_plan', (deck) => {
            const plan = deck.pages[pageId];
            if (!plan) return fail(`No plan for ${pageId}`, deck.stage);
            return deck;
          }),
        );
      },
    },
    {
      name: 'get_deck',
      label: 'Get deck',
      description: 'Read current stage, brief, outline titles, and which pages have plans.',
      parameters: Type.Object({}),
      execute: async () => {
        const ctx = getPptTurnContext();
        if (!ctx?.chatId || !ctx.userId) {
          return jsonToolResult(fail('PPT turn context is missing'));
        }
        const deck = await loadPptDeck(ctx.chatId, ctx.userId);
        if (!toolAllowedInStage('get_deck', deck.stage)) {
          return jsonToolResult(fail('get_deck not allowed', deck.stage));
        }
        return jsonToolResult({
          ok: true,
          summary: `deck · ${deck.stage}`,
          stage: deck.stage,
          brief: deck.brief,
          outline: deck.outline,
          plannedPageIds: Object.keys(deck.pages),
          themeId: deck.themeId,
          questions: deck.questions,
        });
      },
    },
    {
      name: 'set_theme',
      label: 'Set theme',
      description: 'Pick navy-bento, slate-paper, or forest-board. Does not change structure.',
      parameters: Type.Object({
        theme_id: Type.String(),
      }),
      execute: async (_id, args) => {
        const themeId = String((args as { theme_id?: unknown }).theme_id || '').trim();
        if (!isPptThemeId(themeId)) {
          return jsonToolResult(fail('theme_id must be navy-bento | slate-paper | forest-board'));
        }
        return jsonToolResult(
          await withDeck('set_theme', (deck) => ({ ...deck, themeId })),
        );
      },
    },
    {
      name: 'advance_stage',
      label: 'Advance stage',
      description: 'Move to the next stage if gates pass. Never skip.',
      parameters: Type.Object({
        to: Type.String(),
      }),
      execute: async (_id, args) => {
        const toRaw = String((args as { to?: unknown }).to || '').trim();
        if (!isPptStage(toRaw)) return jsonToolResult(fail('Invalid stage'));
        return jsonToolResult(
          await withDeck('advance_stage', (deck) => {
            const reason = advanceBlockReason(deck, toRaw);
            if (reason) return fail(reason, deck.stage);
            return { ...deck, stage: toRaw, questions: null };
          }),
        );
      },
    },
    {
      name: 'export_deck',
      label: 'Export deck',
      description:
        'Mark the deck exportable. Frontend downloads pptx/JSON/HTML from the same page plans. Do not write an exporter.',
      parameters: Type.Object({}),
      execute: async () =>
        jsonToolResult(
          await withDeck('export_deck', (deck) => {
            if (deck.stage === 'design') {
              const expected = nextStage(deck.stage);
              if (expected === 'export') {
                return { ...deck, stage: 'export' };
              }
            }
            return deck.stage === 'export' ? deck : fail('Reach design before export', deck.stage);
          }),
        ),
    },
  ];
}

export function defaultBrief(): PptBrief {
  return {
    audience: '内部同事',
    purpose: '把主题讲清楚并促成下一步',
    pages: 10,
    style: 'navy-bento 专业简洁',
    defaultsApplied: true,
  };
}

export { emptyPptDeck };
