import { NextResponse } from 'next/server';
import { loadWcmsPage } from '@/lib/html/wcmsContent';
import { allowedAssetOrigin } from '@/lib/html/allowedAssetOrigin';
import {
  readWcmsWorkingHtml,
  readWcmsWorkingRevision,
  saveWcmsWorkingHtml,
} from '@/lib/html/wcmsHtmlStore';
import { inlineHtmlAssets } from '@/lib/html/inlineHtmlAssets';
import { toTinyMceBodyFragment } from '@/lib/html/tinyMceFragment';
import {
  parseWcmsBind,
  parseWcmsLang,
  parseWcmsPageIndex,
} from '@/lib/html/wcmsQuery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseId(raw: string): number | null {
  const bind = parseWcmsBind({ wcmsContentId: raw, pageIndex: 0 });
  return bind?.wcmsContentId ?? null;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  const url = new URL(req.url);
  const bind = parseWcmsBind({
    wcmsContentId: id,
    pageIndex: url.searchParams.get('pageIndex'),
    lang: url.searchParams.get('lang'),
  });
  if (!bind) {
    return NextResponse.json({ message: 'Invalid content id' }, { status: 400 });
  }

  const working = readWcmsWorkingHtml(userId, bind);
  let loaded: Awaited<ReturnType<typeof loadWcmsPage>>;
  try {
    loaded = await loadWcmsPage(bind);
  } catch {
    if (working == null) {
      return NextResponse.json(
        { message: 'Failed to load WCMS content' },
        { status: 502 },
      );
    }
    loaded = { ok: false, error: 'Failed to load WCMS content' };
  }
  if (!loaded.ok && working == null) {
    return NextResponse.json({ message: loaded.error }, { status: 404 });
  }
  const rawHtml = working ?? (loaded.ok ? loaded.html : '');
  const fileBase = allowedAssetOrigin(url.searchParams.get('itmsOrigin'));
  const html = toTinyMceBodyFragment(
    await inlineHtmlAssets(rawHtml, {
      baseHref: fileBase,
      allowedOrigin: fileBase,
    }),
  );
  const pageIndex = loaded.ok ? loaded.pageIndex : bind.pageIndex;
  const pageCount = loaded.ok ? loaded.pageCount : 1;
  return NextResponse.json({
    wcmsContentId: bind.wcmsContentId,
    pageIndex,
    pageCount,
    lang: bind.lang,
    titleEn: loaded.ok ? loaded.titleEn : undefined,
    html,
    fileBaseHref: fileBase || null,
    revision: readWcmsWorkingRevision(userId, bind),
  });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  const contentId = parseId(id);
  if (contentId == null) {
    return NextResponse.json({ message: 'Invalid content id' }, { status: 400 });
  }
  let body: { html?: unknown; pageIndex?: unknown } = {};
  try {
    body = (await req.json()) as { html?: unknown; pageIndex?: unknown };
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
  if (typeof body.html !== 'string') {
    return NextResponse.json({ message: 'html is required' }, { status: 400 });
  }
  const bind = {
    wcmsContentId: contentId,
    pageIndex: parseWcmsPageIndex(body.pageIndex),
    lang: parseWcmsLang(
      (body as { lang?: unknown }).lang,
    ),
  };
  const revisionRaw = (body as { revision?: unknown }).revision;
  const expectedRevision =
    typeof revisionRaw === 'number' && Number.isInteger(revisionRaw)
      ? revisionRaw
      : undefined;
  const saved = saveWcmsWorkingHtml({
    userId,
    bind,
    html: body.html,
    expectedRevision,
  });
  if (!saved.ok) {
    return NextResponse.json(
      { message: 'Stale HTML save', revision: saved.revision },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, revision: saved.revision, ...bind });
}
