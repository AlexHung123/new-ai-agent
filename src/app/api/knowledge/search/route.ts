import { NextResponse } from 'next/server';
import { search } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { normalizeSearchRequest } from '@/lib/knowledge/search';

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
  const parsed = normalizeSearchRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }
  try {
    const result = await search(userId, {
      query: parsed.query,
      mode: parsed.mode,
      limit: parsed.limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
