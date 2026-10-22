import {
  parseWcmsLang,
  parseWcmsPageIndex,
  type WcmsBind,
  type WcmsLang,
} from './wcmsQuery';

export type WcmsContentRow = {
  tiny_mce_content_en?: unknown;
  tiny_mce_content_tc?: unknown;
  tiny_mce_content_sc?: unknown;
  title_en?: string | null;
  title_tc?: string | null;
  title_sc?: string | null;
};

export type WcmsPageQuery = (id: number) => Promise<WcmsContentRow | null>;

export type WcmsPageLoad =
  | {
      ok: true;
      wcmsContentId: number;
      html: string;
      pageIndex: number;
      pageCount: number;
      lang: WcmsLang;
      titleEn?: string;
    }
  | { ok: false; error: string };

const HTML_COLUMN: Record<WcmsLang, keyof WcmsContentRow> = {
  en: 'tiny_mce_content_en',
  tc: 'tiny_mce_content_tc',
  sc: 'tiny_mce_content_sc',
};

const TITLE_COLUMN: Record<WcmsLang, keyof WcmsContentRow> = {
  en: 'title_en',
  tc: 'title_tc',
  sc: 'title_sc',
};

export function asHtmlPages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? '' : String(item)));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return asHtmlPages(parsed);
      } catch {
        /* treat as a single page */
      }
    }
    return [value];
  }
  return [];
}

export function pickWcmsPageHtml(
  pages: unknown,
  pageIndex: number,
): { html: string; pageIndex: number; pageCount: number } {
  const list = asHtmlPages(pages);
  if (list.length === 0) {
    return { html: '', pageIndex: 0, pageCount: 0 };
  }
  const idx = Math.min(Math.max(0, pageIndex), list.length - 1);
  return {
    html: list[idx] ?? '',
    pageIndex: idx,
    pageCount: list.length,
  };
}

export async function queryWcmsContentRow(
  id: number,
): Promise<WcmsContentRow | null> {
  const { prismaSecondary } = await import('@/lib/postgres/db');
  const rows = await prismaSecondary.$queryRawUnsafe<WcmsContentRow[]>(
    `SELECT tiny_mce_content_en, tiny_mce_content_tc, tiny_mce_content_sc,
            title_en, title_tc, title_sc
     FROM wcms_content
     WHERE id = $1
       AND deleted_time IS NULL
     LIMIT 1`,
    id,
  );
  return rows[0] ?? null;
}

export async function loadWcmsPage(
  input: WcmsBind & { query?: WcmsPageQuery },
): Promise<WcmsPageLoad> {
  const query = input.query ?? queryWcmsContentRow;
  const lang = parseWcmsLang(input.lang);
  const row = await query(input.wcmsContentId);
  if (!row) {
    return { ok: false, error: 'WCMS content not found' };
  }
  const picked = pickWcmsPageHtml(
    row[HTML_COLUMN[lang]],
    parseWcmsPageIndex(input.pageIndex),
  );
  const titleRaw = row[TITLE_COLUMN[lang]];
  const titleEn =
    typeof titleRaw === 'string' && titleRaw.trim() ? titleRaw.trim() : undefined;
  return {
    ok: true,
    wcmsContentId: input.wcmsContentId,
    html: picked.html,
    pageIndex: picked.pageIndex,
    pageCount: picked.pageCount,
    lang,
    titleEn,
  };
}

export const loadWcmsEnglishPage = loadWcmsPage;
