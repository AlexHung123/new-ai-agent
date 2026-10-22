import { NextResponse } from 'next/server';
import { readDocumentFile } from '@/lib/documents/readDocumentFile';

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
  const result = readDocumentFile(id, url.searchParams.get('path'));
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({
    path: result.path,
    content: result.content,
    language: result.language,
  });
}
