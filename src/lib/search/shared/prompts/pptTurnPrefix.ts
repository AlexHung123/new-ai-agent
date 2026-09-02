import { loadWritingIndexMd } from './writingTurnPrefix';
import { resolveMentionedFiles } from '@/lib/writing/mentions';
import type { WritingTurnContext } from '../runtime/writingTurnContext';
import { getWritingTurnContext } from '../runtime/writingTurnContext';
import { listOutlinePages } from '@/lib/ppt/outline';
import { missingPlans } from '@/lib/ppt/stage';
import type { PptDeckState } from '@/lib/ppt/types';

const STAGE_HINT: Record<PptDeckState['stage'], string> = {
  discover:
    'Read attachments if listed. Call ask_user (≤5) or commit_brief. Do not outline yet.',
  outline:
    'Call commit_outline. Then ask the user to review the sticky wall. Do not plan pages.',
  plan: 'Call commit_page_plan for each missing content page. Structural pages are already filled.',
  design: 'Call set_theme. Do not add/remove cards or change layout.',
  export: 'Call export_deck if the user wants a download. Do not redesign.',
};

export function buildPptUserPrompt(
  userMessage: string,
  deck: PptDeckState,
  writing: WritingTurnContext | undefined = getWritingTurnContext(),
): string {
  const planned = Object.keys(deck.pages);
  const missing = missingPlans(deck);
  const outlineLines = deck.outline
    ? listOutlinePages(deck.outline)
        .map(
          (page) =>
            `- ${page.page_id} [${page.kind}] ${page.title}${planned.includes(page.page_id) ? ' (planned)' : ''}`,
        )
        .join('\n')
    : '(none)';

  const state = [
    `[PPT state]`,
    `stage: ${deck.stage}`,
    `hint: ${STAGE_HINT[deck.stage]}`,
    `theme: ${deck.themeId}`,
    `brief: ${deck.brief ? JSON.stringify(deck.brief) : '(none)'}`,
    `pending questions: ${deck.questions ? deck.questions.map((q) => q.prompt).join(' | ') : '(none)'}`,
    `pages:`,
    outlineLines,
    missing.length ? `missing plans: ${missing.join(', ')}` : 'missing plans: none',
  ].join('\n');

  const question = `[User request]\n${userMessage}`;
  if (!writing) return `${state}\n\n${question}`;

  const index = loadWritingIndexMd(writing.rootAbs);
  const mentioned = resolveMentionedFiles(userMessage, writing.files || []);
  const mentionBlock =
    mentioned.length > 0
      ? `[Mentioned files]\nGrep these files first, then fs_read only the matching range:\n` +
        mentioned
          .map(
            (file) =>
              `- \`${file.relDir}/INDEX.md\` — ${file.name} (${file.parts} part${file.parts === 1 ? '' : 's'})`,
          )
          .join('\n') +
        '\n\n'
      : '';

  return (
    `${state}\n\n` +
    `[Attachments]\n` +
    `Files belong to this user. INDEX.md is below when present.\n` +
    `Do not fs_read INDEX.md just to reload it. If it lists no files, do not use fs_*.\n\n` +
    mentionBlock +
    (index
      ? index.content + (index.truncated ? '\n…(truncated)\n' : '\n')
      : '') +
    `\n${question}`
  );
}
