import { NextResponse } from 'next/server';
import { createFolder } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { isSafeRelativePath } from '@/lib/knowledge/paths';

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
  const path =
    body && typeof body === 'object' && 'path' in body
      ? String((body as { path?: unknown }).path || '')
      : '';
  if (!isSafeRelativePath(path)) {
    return NextResponse.json({ message: 'Invalid folder path' }, { status: 400 });
  }
  try {
    const result = await createFolder(userId, path);
    return NextResponse.json(result);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
