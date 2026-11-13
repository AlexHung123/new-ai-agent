import { NextRequest, NextResponse } from 'next/server';
import { requireVoiceUser } from '@/lib/voice/requireVoiceUser';
import { getTypoSummaryInstruction } from '@/lib/voice/typoSummaryConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await requireVoiceUser(req);
  if (userId instanceof NextResponse) return userId;

  return NextResponse.json({ instruction: getTypoSummaryInstruction() });
}
