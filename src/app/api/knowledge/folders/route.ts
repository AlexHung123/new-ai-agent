import { NextResponse } from 'next/server';
import { createFolder } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { parseKnowledgeLibrary, parseKnowledgeLibraryStrict } from '@/lib/knowledge/library';
import { isSafeRelativePath } from '@/lib/knowledge/paths';
import { canWritePublicLibrary } from '@/lib/knowledge/publicAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const path = typeof rec.path === 'string' ? rec.path : '';
  if (!isSafeRelativePath(path)) {
    return NextResponse.json({ message: 'Invalid folder path' }, { status: 400 });
  }
  const rawLibrary = rec.library ?? rec.visibility;
  if (rawLibrary != null && parseKnowledgeLibraryStrict(rawLibrary) == null) {
    return NextResponse.json(
      { message: 'library must be private or public' },
      { status: 400 },
    );
  }
  const library = parseKnowledgeLibrary(rawLibrary, 'private');
  if (library === 'public' && !canWritePublicLibrary(userId)) {
    return NextResponse.json(
      {
        message:
          'Public folders can only be created by a knowledge curator.',
        error: 'forbidden',
      },
      { status: 403 },
    );
  }
  try {
    const result = await createFolder(userId, path, { library });
    return NextResponse.json({ ...result, library });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
