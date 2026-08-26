import { NextRequest, NextResponse } from 'next/server';
import {
  parseSpeechFormData,
  synthesizeSpeech,
} from '@/lib/voice/speechRequest';
import { DEFAULT_TTS_MODEL } from '@/lib/voice/ttsModels';
import { saveVoiceHistory } from '@/lib/voice/voiceHistory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart form data' },
      { status: 400 },
    );
  }

  const parsed = await parseSpeechFormData(form);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }

  const result = await synthesizeSpeech(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  try {
    await saveVoiceHistory({
      userId,
      spokenText: parsed.data.input,
      model: parsed.data.model || DEFAULT_TTS_MODEL,
      refText: parsed.data.refText,
    });
  } catch (err) {
    console.error('Failed to save voice history:', err);
  }

  return new NextResponse(Buffer.from(result.audio), {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': 'attachment; filename="speech.wav"',
      'Cache-Control': 'no-store',
    },
  });
}
