import { NextResponse } from 'next/server';
import {
  addReaderMark,
  getReadingAttachment,
  readMarks,
  ReadingAttachmentError,
  removeReaderMark,
} from '@/lib/reading/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function userIdFrom(req: Request): string | null {
  return req.headers.get('x-user-id');
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const { id } = await params;
  if (!getReadingAttachment(userId, id)) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }
  return NextResponse.json({ items: readMarks(userId, id) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const { id } = await params;
  let body: {
    kind?: string;
    page?: number;
    quote?: string;
    question?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const kind = body.kind === 'ask' ? 'ask' : body.kind === 'highlight' ? 'highlight' : null;
  if (!kind) {
    return NextResponse.json({ message: 'kind must be highlight or ask' }, { status: 400 });
  }
  try {
    const item = addReaderMark(userId, id, {
      kind,
      page: Number(body.page) || 1,
      quote: String(body.quote || ''),
      question: body.question,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ReadingAttachmentError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const { id } = await params;
  const url = new URL(req.url);
  const markId = (url.searchParams.get('markId') || '').trim();
  if (!markId) {
    return NextResponse.json({ message: 'markId is required' }, { status: 400 });
  }
  const ok = removeReaderMark(userId, id, markId);
  if (!ok) {
    return NextResponse.json({ message: 'Mark not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
