import { NextResponse } from 'next/server';
import { readWritingFile } from '@/lib/writing/readWritingFile';

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
  const result = readWritingFile(userId, fileId);
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({
    path: result.path,
    name: result.name,
    content: result.content,
    language: result.language,
  });
}
