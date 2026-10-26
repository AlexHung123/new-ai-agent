import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/verifyToken';

export async function requireVoiceUser(
  req: NextRequest,
): Promise<string | NextResponse> {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  // The upload route is outside middleware, so a caller can send x-user-id.
  // The status route is inside middleware, which replaces that header with the
  // token user. Prefer the token so create and poll name the same person.
  if (!token) {
    const existing = req.headers.get('x-user-id')?.trim();
    if (existing) return existing;
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }

  try {
    const verified = await verifyToken(token);
    if (!verified.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 },
      );
    }
    return verified.userId;
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired authentication token' },
      { status: 401 },
    );
  }
}
