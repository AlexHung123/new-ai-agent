import { NextResponse } from 'next/server';
import { getFileContent } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  const { id } = await context.params;
  const treeParam = new URL(req.url).searchParams.get('tree') || 'markdown';
  if (treeParam !== 'markdown' && treeParam !== 'inbox') {
    return NextResponse.json({ message: 'tree must be markdown or inbox' }, { status: 400 });
  }
  try {
    const { bytes, contentType } = await getFileContent(userId, id, treeParam);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type':
          treeParam === 'markdown'
            ? 'text/markdown; charset=utf-8'
            : contentType,
      },
    });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
