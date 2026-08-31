import { NextResponse } from 'next/server';
import {
  getReadingAttachment,
  removeReadingAttachment,
} from '@/lib/reading/store';
import { toPublicReadingAttachment } from '@/lib/reading/types';

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
  const item = getReadingAttachment(userId, id);
  if (!item) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }
  return NextResponse.json({ item: toPublicReadingAttachment(item) });
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
  const ok = removeReadingAttachment(userId, id);
  if (!ok) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
