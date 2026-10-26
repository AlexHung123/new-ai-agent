import { NextRequest, NextResponse } from 'next/server';
import { requireVoiceUser } from '@/lib/voice/requireVoiceUser';
import { getSttConfig, isSttConfigured } from '@/lib/voice/sttConfig';
import {
  isTerminalTranscribeStatus,
  markdownFromJobResult,
  readJobView,
} from '@/lib/voice/transcribeJobProtocol';
import {
  markTranscribeHistorySaved,
  ownedTranscribeJob,
  rememberTranscribeJob,
} from '@/lib/voice/transcribeJobStore';
import { saveTranscriptHistory } from '@/lib/voice/voiceHistory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JOB_ID = /^[a-f0-9]{32}$/;

async function loadOwnedJob(req: NextRequest, jobId: string) {
  const userId = await requireVoiceUser(req);
  if (userId instanceof NextResponse) return userId;
  if (!JOB_ID.test(jobId)) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  const owned = ownedTranscribeJob(jobId, userId);
  const config = getSttConfig();
  if (!isSttConfigured(config)) {
    return NextResponse.json(
      { error: 'Speech-to-text server is not reachable.' },
      { status: 502 },
    );
  }
  return { userId, owned, config };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const loaded = await loadOwnedJob(req, jobId);
  if (loaded instanceof NextResponse) return loaded;
  let owned = loaded.owned;

  let response: Response;
  try {
    response = await fetch(
      `${loaded.config.baseUrl}/v1/audio/jobs/${jobId}`,
      { cache: 'no-store' },
    );
  } catch (error) {
    console.error('Failed to poll transcription job', error);
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
  if (!response.ok) {
    const detail =
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { detail?: unknown }).detail === 'string'
        ? (parsed as { detail: string }).detail
        : `Transcription failed (${response.status})`;
    return NextResponse.json({ error: detail }, { status: response.status });
  }

  const view = readJobView(parsed);
  if (!view) {
    return NextResponse.json(
      { error: 'Transcription service returned an invalid job.' },
      { status: 502 },
    );
  }

  if (!owned) {
    rememberTranscribeJob({
      jobId,
      userId: loaded.userId,
      filename: view.filename?.trim() || 'audio',
      language: null,
    });
    owned = ownedTranscribeJob(jobId, loaded.userId);
  }
  if (!owned) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (view.status === 'succeeded') {
    const rendered = markdownFromJobResult({
      filename: owned.filename,
      language: owned.language,
      result: view.result,
    });
    if (!owned.historySaved) {
      markTranscribeHistorySaved(jobId);
      try {
        await saveTranscriptHistory({
          userId: loaded.userId,
          filename: owned.filename,
          markdown: rendered.markdown,
        });
      } catch (error) {
        owned.historySaved = false;
        console.error('Failed to save transcript history:', error);
      }
    }
    return NextResponse.json({
      jobId,
      status: view.status,
      markdown: rendered.markdown,
      downloadName: rendered.downloadName,
      filename: owned.filename,
    });
  }

  if (view.status === 'failed' || view.status === 'cancelled') {
    return NextResponse.json({
      jobId,
      status: view.status,
      error: view.error || 'Transcription failed',
    });
  }

  return NextResponse.json({
    jobId,
    status: isTerminalTranscribeStatus(view.status) ? view.status : view.status,
    filename: owned.filename,
  });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const loaded = await loadOwnedJob(req, jobId);
  if (loaded instanceof NextResponse) return loaded;

  try {
    const response = await fetch(
      `${loaded.config.baseUrl}/v1/audio/jobs/${jobId}`,
      { method: 'DELETE' },
    );
    const text = await response.text();
    let parsed: unknown = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = {};
    }
    const view = readJobView(parsed);
    return NextResponse.json({
      jobId,
      status: view?.status || (response.ok ? 'cancelled' : 'failed'),
    });
  } catch (error) {
    console.error('Failed to cancel transcription job', error);
    return NextResponse.json(
      { error: 'Speech-to-text server is not reachable.' },
      { status: 502 },
    );
  }
}
