import { NextResponse } from 'next/server';
import { exportPptxBuffer } from '@/lib/ppt/exportPptx';
import { renderDeckHtml } from '@/lib/ppt/render';
import { loadPptDeck } from '@/lib/ppt/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const chatId = (url.searchParams.get('chatId') || '').trim();
  const format = (url.searchParams.get('format') || 'json').trim();
  if (!chatId) {
    return NextResponse.json({ message: 'chatId is required' }, { status: 400 });
  }

  try {
    const deck = await loadPptDeck(chatId, userId);
    const stem = `deck-${chatId.slice(0, 8)}`;
    if (format === 'pptx') {
      const buf = await exportPptxBuffer(deck);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${stem}.pptx"`,
        },
      });
    }
    if (format === 'html') {
      const html = renderDeckHtml(deck);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${stem}.html"`,
        },
      });
    }
    return new NextResponse(JSON.stringify(deck, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${stem}.json"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not export deck';
    const status =
      (error as { status?: number }).status === 403
        ? 403
        : message.includes('No planned pages')
          ? 400
          : 500;
    return NextResponse.json({ message }, { status });
  }
}
