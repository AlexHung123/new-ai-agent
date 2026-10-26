import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/verifyToken';

export async function requireVoiceUser(
  req: NextRequest,
): Promise<string | NextResponse> {
  const existing = req.headers.get('x-user-id')?.trim();
  if (existing) return existing;

  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
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
