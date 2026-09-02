import { NextRequest, NextResponse } from 'next/server';
import { transcribeUpload } from '@/lib/voice/transcribeRequest';
import { saveTranscriptHistory } from '@/lib/voice/voiceHistory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 3600;

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
  } catch (err) {
    console.error('Failed to parse transcribe multipart body', {
      contentType: req.headers.get('content-type'),
      error: err,
    });
    return NextResponse.json(
      { error: 'Expected multipart form data' },
      { status: 400 },
    );
  }

  const result = await transcribeUpload(form);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  try {
    await saveTranscriptHistory({
      userId,
      filename: result.filename,
      markdown: result.markdown,
    });
  } catch (err) {
    console.error('Failed to save transcript history:', err);
  }

  return NextResponse.json({
    markdown: result.markdown,
    language: result.language,
    durationSeconds: result.durationSeconds,
    filename: result.filename,
    downloadName: result.downloadName,
  });
}
