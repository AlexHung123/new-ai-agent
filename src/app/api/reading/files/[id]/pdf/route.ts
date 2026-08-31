import { existsSync, readFileSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { readingOriginalAbs } from '@/lib/reading/paths';
import { getReadingAttachment } from '@/lib/reading/store';

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
  const abs = readingOriginalAbs(userId, id);
  if (!existsSync(abs)) {
    return NextResponse.json({ message: 'PDF is missing' }, { status: 404 });
  }
  const bytes = readFileSync(abs);
  const filename = encodeURIComponent(item.name);
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${filename}`,
      'Cache-Control': 'private, max-age=120',
    },
  });
}
