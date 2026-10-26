import { NextRequest, NextResponse } from 'next/server';
import { requireVoiceUser } from '@/lib/voice/requireVoiceUser';
import { getSttConfig, isSttConfigured } from '@/lib/voice/sttConfig';
import {
  filenameFromHeader,
  readCreatedJob,
  transcribeUploadHeaders,
  validateTranscribeUpload,
} from '@/lib/voice/transcribeJobProtocol';
import { rememberTranscribeJob } from '@/lib/voice/transcribeJobStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 3600;

export async function POST(req: NextRequest) {
  const userId = await requireVoiceUser(req);
  if (userId instanceof NextResponse) return userId;

  const config = getSttConfig();
  if (!isSttConfigured(config)) {
    return NextResponse.json(
      {
        error:
          'STT is not configured. Set stt.baseUrl in data/config.json (or stt.mock: true).',
      },
      { status: 400 },
    );
  }

  const filename = filenameFromHeader(req.headers.get('x-filename'));
  const rawLength = req.headers.get('content-length');
  const contentLength =
    rawLength && Number.isFinite(Number(rawLength)) ? Number(rawLength) : null;
  const contentType = req.headers.get('content-type');
  const language = (req.headers.get('x-language') || '').trim() || null;
  const valid = validateTranscribeUpload({
    filename: req.headers.get('x-filename') ? filename : '',
    contentType,
    contentLength,
    maxBytes: config.maxUploadBytes,
  });
  if (!valid.ok) {
    return NextResponse.json({ error: valid.error }, { status: valid.status });
  }
  if (!req.body) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const headers = transcribeUploadHeaders({
    filename,
    language,
    contentType,
    contentLength: rawLength,
  });

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/v1/audio/jobs`, {
      method: 'POST',
      headers,
      body: req.body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
  } catch (error) {
    console.error('Failed to reach transcription jobs endpoint', error);
    return NextResponse.json(
      { error: 'Speech-to-text server is not reachable.' },
      { status: 502 },
    );
  }

  const text = await response.text();
  let parsed: unknown = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = {};
  }
  const created = readCreatedJob(response.status, parsed);
  if (!created.ok) {
    return NextResponse.json(
      { error: created.error },
      { status: created.status },
    );
  }

  rememberTranscribeJob({
    jobId: created.jobId,
    userId,
    filename,
    language,
  });
  return NextResponse.json({
    jobId: created.jobId,
    status: created.status,
    filename,
  });
}
