import { NextResponse } from 'next/server';
import { getTask } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  const { id } = await context.params;
  try {
    const body = await getTask(userId, id);
    return NextResponse.json(body);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
