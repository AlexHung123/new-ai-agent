import { NextResponse } from 'next/server';
import { getTree } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  try {
    const body = await getTree(userId);
    return NextResponse.json(body);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
