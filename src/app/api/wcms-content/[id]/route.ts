import { NextResponse } from 'next/server';
import { loadWcmsPage } from '@/lib/html/wcmsContent';
import { allowedAssetOrigin } from '@/lib/html/allowedAssetOrigin';
import { inlineHtmlAssets } from '@/lib/html/inlineHtmlAssets';
import { toTinyMceBodyFragment } from '@/lib/html/tinyMceFragment';
import { parseWcmsBind } from '@/lib/html/wcmsQuery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  let loaded: Awaited<ReturnType<typeof loadWcmsPage>>;
  try {
    loaded = await loadWcmsPage(bind);
  } catch {
    return NextResponse.json(
      { message: 'Failed to load WCMS content' },
      { status: 502 },
    );
  }
  if (!loaded.ok) {
    return NextResponse.json({ message: loaded.error }, { status: 404 });
  }
  const fileBase = allowedAssetOrigin(url.searchParams.get('itmsOrigin'));
  const html = toTinyMceBodyFragment(
    await inlineHtmlAssets(loaded.html, {
      baseHref: fileBase,
      allowedOrigin: fileBase,
    }),
  );
  return NextResponse.json({
    wcmsContentId: bind.wcmsContentId,
    pageIndex: loaded.pageIndex,
    pageCount: loaded.pageCount,
    lang: bind.lang,
    titleEn: loaded.titleEn,
    html,
    fileBaseHref: fileBase || null,
  });
}
