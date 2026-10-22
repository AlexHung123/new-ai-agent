import { NextResponse } from 'next/server';
import { allowedAssetOrigin } from '@/lib/html/allowedAssetOrigin';
import { inlineHtmlAssets } from '@/lib/html/inlineHtmlAssets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  let body: { html?: unknown; itmsOrigin?: unknown } = {};
  try {
    body = (await req.json()) as { html?: unknown; itmsOrigin?: unknown };
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
  if (typeof body.html !== 'string') {
    return NextResponse.json({ message: 'html is required' }, { status: 400 });
  }
  const origin = allowedAssetOrigin(body.itmsOrigin);
  const html = await inlineHtmlAssets(body.html, {
    baseHref: origin,
    allowedOrigin: origin,
  });
  return NextResponse.json({ html });
}
