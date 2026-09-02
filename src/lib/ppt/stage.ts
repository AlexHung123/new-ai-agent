import type { PptDeckState, PptStage } from './types';
import { listOutlinePages } from './outline';

export const PPT_TOOL_NAMES = [
  'ask_user',
  'commit_brief',
  'commit_outline',
  'patch_outline',
  'commit_page_plan',
  'get_page_plan',
  'get_deck',
  'set_theme',
  'advance_stage',
  'export_deck',
] as const;

export type PptToolName = (typeof PPT_TOOL_NAMES)[number];

const TOOL_STAGES: Record<PptToolName, readonly PptStage[]> = {
  ask_user: ['discover'],
  commit_brief: ['discover'],
  commit_outline: ['outline'],
  patch_outline: ['outline', 'plan', 'design'],
  commit_page_plan: ['plan'],
  get_page_plan: ['plan', 'design', 'export'],
  get_deck: ['discover', 'outline', 'plan', 'design', 'export'],
  set_theme: ['design', 'export'],
  advance_stage: ['discover', 'outline', 'plan', 'design'],
  export_deck: ['design', 'export'],
};

const STAGE_ORDER: PptStage[] = [
  'discover',
  'outline',
  'plan',
  'design',
  'export',
];

export function toolAllowedInStage(
  tool: string,
  stage: PptStage,
): boolean {
  const allowed = TOOL_STAGES[tool as PptToolName];
  if (!allowed) return false;
  return allowed.includes(stage);
}

export function nextStage(stage: PptStage): PptStage | null {
  const i = STAGE_ORDER.indexOf(stage);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1] ?? null;
}

export function stageIndex(stage: PptStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function missingPlans(deck: PptDeckState): string[] {
  if (!deck.outline) return [];
  return listOutlinePages(deck.outline)
    .filter((page) => !deck.pages[page.page_id])
    .map((page) => page.page_id);
}

export function advanceBlockReason(
  deck: PptDeckState,
  to: PptStage,
): string | null {
  const from = deck.stage;
  const expected = nextStage(from);
  if (to !== expected) {
    return expected
      ? `Can only advance to ${expected} from ${from}`
      : `Already at ${from}`;
  }
  if (to === 'outline' && !deck.brief) {
    return 'Confirm audience, purpose, pages, and style first';
  }
  if (to === 'plan' && !deck.outline) {
    return 'Commit an outline before planning pages';
  }
  if (to === 'design') {
    if (!deck.outline) return 'Outline is required';
    const missing = missingPlans(deck);
    if (missing.length > 0) {
      return `Plan every page first (missing ${missing.slice(0, 4).join(', ')})`;
    }
  }
  return null;
}
