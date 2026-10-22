import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import { allowedAssetOrigin } from '@/lib/html/allowedAssetOrigin';
import { saveWcmsWorkingHtml } from '@/lib/html/wcmsHtmlStore';
import { inlineHtmlAssets } from '@/lib/html/inlineHtmlAssets';
import { toTinyMceBodyFragment } from '@/lib/html/tinyMceFragment';
import { getHtmlAgentTurnContext } from '../runtime/htmlAgentTurnContext';
import { jsonToolResult } from '../runtime/piToolResult';

const MAX_HTML_CHARS = 400_000;

function userAskedToDelete(message: string | undefined): boolean {
  return /delete|remove|clear|清空|删除|刪除|去掉|清除/i.test(message || '');
}

export function shouldRejectHtmlShrink(
  previous: string,
  next: string,
  userMessage?: string,
): boolean {
  if (previous.length < 200) return false;
  if (next.length >= previous.length * 0.5) return false;
  return !userAskedToDelete(userMessage);
}

export function createHtmlGetTool(): AgentTool {
  return {
    name: 'html_get',
    label: 'Read HTML',
    description:
      'Return the current WCMS TinyMCE HTML document bound to this chat. Use before a small edit when the document was not already injected.',
    parameters: Type.Object({}),
    execute: async () => {
      const ctx = getHtmlAgentTurnContext();
      if (!ctx) {
        return jsonToolResult({
          ok: false,
          error: 'No HTML document bound for this turn',
        });
      }
      return jsonToolResult({
        ok: true,
        wcmsContentId: ctx.bind?.wcmsContentId ?? null,
        pageIndex: ctx.bind?.pageIndex ?? 0,
        html: ctx.html,
        chars: ctx.html.length,
      });
    },
  };
}

export function createHtmlSetTool(): AgentTool {
  return {
    name: 'html_set',
    label: 'Update HTML',
    description:
      'Replace the bound TinyMCE HTML document. Pass the full fragment (scripts, iframes, and meta stay). The live preview updates after this call. Do not dump the HTML into the user-visible reply.',
    parameters: Type.Object({
      html: Type.String({
        description:
          'Body-only TinyMCE fragment. Inline CSS in style tags and JS in script tags. No html, head, or body tags.',
      }),
    }),
    execute: async (_id, args) => {
      const ctx = getHtmlAgentTurnContext();
      if (!ctx) {
        return jsonToolResult({
          ok: false,
          error: 'No HTML document bound for this turn',
        });
      }
      const rawHtml =
        args &&
        typeof args === 'object' &&
        typeof (args as { html?: unknown }).html === 'string'
          ? (args as { html: string }).html
          : '';
      if (rawHtml.length > MAX_HTML_CHARS) {
        return jsonToolResult({
          ok: false,
          error: `HTML is too large (${rawHtml.length} characters). The limit is ${MAX_HTML_CHARS}.`,
        });
      }
      if (shouldRejectHtmlShrink(ctx.html || '', rawHtml, ctx.userMessage)) {
        return jsonToolResult({
          ok: false,
          error: `Refusing to replace ${ctx.html.length} characters with ${rawHtml.length}. Call html_get and send the full fragment unless the user asked to delete content.`,
        });
      }
      const origin = allowedAssetOrigin(ctx.fileBaseHref);
      const html = toTinyMceBodyFragment(
        await inlineHtmlAssets(rawHtml, {
          baseHref: origin,
          allowedOrigin: origin,
        }),
      );
      ctx.html = html;
      let revision: number | undefined;
      if (ctx.bind) {
        revision = saveWcmsWorkingHtml({
          userId: ctx.userId,
          bind: ctx.bind,
          html,
        }).revision;
      }
      ctx.emitHtml?.(html, revision);
      return jsonToolResult({
        ok: true,
        chars: html.length,
        instruction:
          'The preview updated. Confirm in one short line. Do not paste the HTML into the chat.',
      });
    },
  };
}
