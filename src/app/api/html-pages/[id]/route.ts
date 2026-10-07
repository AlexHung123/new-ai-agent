import { NextResponse } from 'next/server';
import { htmlPageResponseHeaders } from '@/lib/html/headers';
import { isHtmlPageId } from '@/lib/html/paths';
import { readHtmlPage } from '@/lib/html/store';

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
  if (!isHtmlPageId(id)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  const html = readHtmlPage({ userId, pageId: id });
  if (html == null) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  return new NextResponse(html, { headers: htmlPageResponseHeaders() });
}
