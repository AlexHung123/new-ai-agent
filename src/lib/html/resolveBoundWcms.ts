import {
  parseWcmsBind,
  parseWcmsContentId,
  type WcmsBind,
  type WcmsLang,
} from './wcmsQuery';

export type BoundWcmsInput = {
  focusMode: string;
  chatExists: boolean;
  existingWcmsContentId?: unknown;
  existingWcmsPageIndex?: unknown;
  existingWcmsLang?: unknown;
  bodyWcmsContentId?: unknown;
  bodyWcmsPageIndex?: unknown;
  bodyWcmsLang?: unknown;
};

export type BoundWcmsResult =
  | { status: 'none' }
  | { status: 'ok'; wcmsContentId: number; pageIndex: number; lang: WcmsLang };

export function resolveBoundWcms(input: BoundWcmsInput): BoundWcmsResult {
  if (input.focusMode !== 'agentHtml') return { status: 'none' };
  if (input.chatExists) {
    const existing = parseWcmsBind({
      wcmsContentId: input.existingWcmsContentId,
      pageIndex: input.existingWcmsPageIndex,
      lang: input.existingWcmsLang,
    });
    if (existing) return { status: 'ok', ...existing };
  }
  const bind = parseWcmsBind({
    wcmsContentId: input.bodyWcmsContentId,
    pageIndex: input.bodyWcmsPageIndex,
    lang: input.bodyWcmsLang,
  });
  if (!bind) return { status: 'none' };
  return { status: 'ok', ...bind };
}

export function wcmsBindPatchForExistingChat(
  chat: { wcmsContentId?: unknown },
  incoming: {
    wcmsContentId?: number | null;
    wcmsPageIndex?: number | null;
    wcmsLang?: string | null;
  },
): {
  wcmsContentId: number;
  wcmsPageIndex: number | null;
  wcmsLang: string | null;
} | null {
  if (parseWcmsContentId(chat.wcmsContentId) != null) return null;
  const bind = parseWcmsBind({
    wcmsContentId: incoming.wcmsContentId,
    pageIndex: incoming.wcmsPageIndex,
    lang: incoming.wcmsLang,
  });
  if (!bind) return null;
  return {
    wcmsContentId: bind.wcmsContentId,
    wcmsPageIndex: bind.pageIndex,
    wcmsLang: bind.lang,
  };
}

export function wcmsBindFromResult(
  result: BoundWcmsResult,
): WcmsBind | null {
  if (result.status !== 'ok') return null;
  return {
    wcmsContentId: result.wcmsContentId,
    pageIndex: result.pageIndex,
    lang: result.lang,
  };
}
