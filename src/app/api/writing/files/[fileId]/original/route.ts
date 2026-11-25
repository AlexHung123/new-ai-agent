import { NextResponse } from 'next/server';
import {
  contentDispositionInline,
  readWritingOriginalFile,
} from '@/lib/writing/readWritingOriginalFile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }

  const { fileId } = await context.params;
  const result = readWritingOriginalFile(userId, fileId);
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }

  return new NextResponse(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': contentDispositionInline(result.name),
      'Cache-Control': 'private, no-store',
    },
  });
}
