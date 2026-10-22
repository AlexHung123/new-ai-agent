export type WcmsLang = 'en' | 'tc' | 'sc';

export type WcmsBind = {
  wcmsContentId: number;
  pageIndex: number;
  lang: WcmsLang;
};

function asSafeInt(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && Number.isSafeInteger(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const n = Number(raw.trim());
    if (Number.isSafeInteger(n)) return n;
  }
  return null;
}

export function parseWcmsContentId(raw: unknown): number | null {
  const n = asSafeInt(raw);
  if (n == null || n <= 0) return null;
  return n;
}

export function parseWcmsPageIndex(raw: unknown): number {
  const n = asSafeInt(raw);
  if (n == null || n < 0) return 0;
  return n;
}

export function parseWcmsLang(raw: unknown): WcmsLang {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (value === 'tc' || value === 'sc') return value;
  return 'en';
}

export function parseItmsOrigin(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function parseWcmsBind(input: {
  wcmsContentId?: unknown;
  pageIndex?: unknown;
  lang?: unknown;
}): WcmsBind | null {
  const wcmsContentId = parseWcmsContentId(input.wcmsContentId);
  if (wcmsContentId == null) return null;
  return {
    wcmsContentId,
    pageIndex: parseWcmsPageIndex(input.pageIndex),
    lang: parseWcmsLang(input.lang),
  };
}

export const AGENT_HTML_APPLY_TYPE = 'agent-html-apply';

export function agentHtmlApplyMessage(bind: WcmsBind, html: string) {
  return {
    type: AGENT_HTML_APPLY_TYPE,
    wcmsContentId: bind.wcmsContentId,
    pageIndex: bind.pageIndex,
    lang: bind.lang,
    html,
  };
}

export function urlWcmsBoot(search: {
  get(name: string): string | null;
}): { bind: WcmsBind; origin: string | null } | null {
  const bind = parseWcmsBind({
    wcmsContentId: search.get('wcmsContentId'),
    pageIndex: search.get('pageIndex'),
    lang: search.get('lang'),
  });
  if (!bind) return null;
  return { bind, origin: parseItmsOrigin(search.get('itmsOrigin')) };
}

export function agentHtmlChatHref(
  bind: WcmsBind,
  itmsOrigin?: string | null,
): string {
  const params = new URLSearchParams({
    wcmsContentId: String(bind.wcmsContentId),
    pageIndex: String(bind.pageIndex),
    lang: bind.lang,
  });
  const origin = parseItmsOrigin(itmsOrigin);
  if (origin) params.set('itmsOrigin', origin);
  return `/itms/ai/?${params.toString()}`;
}
