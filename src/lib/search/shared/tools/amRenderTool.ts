import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import { getHtmlTurnContext } from '@/lib/html/htmlTurnContext';
import {
  renderHtmlDraft,
  type AmRunner,
} from '@/lib/html/render';
import { jsonToolResult } from '../runtime/piToolResult';

export function createAmRenderTool(opts?: { runAm?: AmRunner }): AgentTool {
  return {
    name: 'am_render',
    label: 'Render HTML page',
    description:
      'Render a short Markdown explainer draft into one self-contained HTML page. Pass the full draft (frontmatter + ## panels). Do not hand-write HTML/CSS/SVG. On error, fix the draft and call again.',
    parameters: Type.Object({
      draft: Type.String({
        description:
          'Extended Markdown draft: optional YAML frontmatter (title, theme) then ## panels with flow/sequence/tree/timeline/table/callout',
      }),
    }),
    execute: async (_id, args) => {
      const ctx = getHtmlTurnContext();
      if (!ctx?.htmlMode || !ctx.userId) {
        return jsonToolResult({
          ok: false,
          error: 'HTML mode is off for this turn',
        });
      }
      const draft =
        args && typeof args === 'object' && typeof (args as { draft?: unknown }).draft === 'string'
          ? (args as { draft: string }).draft
          : '';
      const result = await renderHtmlDraft({
        userId: ctx.userId,
        draft,
        runAm: opts?.runAm,
      });
      if (!result.ok) return jsonToolResult(result);
      return jsonToolResult({
        ok: true,
        pageId: result.pageId,
        href: result.href,
        warnings: result.warnings,
        instruction: `End the user-visible reply with a markdown link to ${result.href}`,
      });
    },
  };
}
