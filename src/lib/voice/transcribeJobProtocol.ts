import { isAudioUpload } from './audio-formats';
import { normalizeSttResponse } from './sttClient';
import { toHkTraditionalResult } from './traditionalChinese';
import {
  buildTranscriptMarkdown,
  transcriptDownloadFilename,
} from './transcriptFormat';

export const TRANSCRIBE_POLL_MS = 2000;

export type TranscribeJobStatus =
  | 'uploading'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type CreatedTranscribeJob =
  | { ok: true; jobId: string; status: string }
  | { ok: false; status: number; error: string };

export type TranscribeJobView = {
  id: string;
  status: string;
  filename?: string;
  error?: string | null;
  result?: unknown;
};

export function transcribeUploadHeaders(input: {
  filename: string;
  language?: string | null;
  contentType?: string | null;
  contentLength?: string | null;
}): Record<string, string> {
  const headers: Record<string, string> = {
    'x-filename': input.filename,
    'x-spk': 'true',
    'content-type': input.contentType?.trim() || 'application/octet-stream',
  };
  const language = input.language?.trim();
  if (language) headers['x-language'] = language;
  const contentLength = input.contentLength?.trim();
  if (contentLength) headers['content-length'] = contentLength;
  return headers;
}

export function validateTranscribeUpload(input: {
  filename: string;
  contentType?: string | null;
  contentLength?: number | null;
  maxBytes: number;
}): { ok: true } | { ok: false; status: number; error: string } {
  if (!input.filename.trim()) {
    return { ok: false, status: 400, error: 'file is required' };
  }
  if (
    input.contentLength != null &&
    Number.isFinite(input.contentLength) &&
    input.contentLength <= 0
  ) {
    return { ok: false, status: 400, error: 'This file is empty.' };
  }
  if (
    input.contentLength != null &&
    Number.isFinite(input.contentLength) &&
    input.contentLength > input.maxBytes
  ) {
    return {
      ok: false,
      status: 400,
      error: `File must be ${input.maxBytes} bytes or smaller`,
    };
  }
  if (!isAudioUpload(input.filename, input.contentType)) {
    return {
      ok: false,
      status: 400,
      error:
        'This file type is not supported. Upload mp3, wav, m4a, mp4, flac, ogg, aac, webm, wma, or mkv.',
    };
  }
  return { ok: true };
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.error === 'string' && record.error.trim()) return record.error;
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail;
  return fallback;
}

export function readCreatedJob(
  status: number,
  body: unknown,
): CreatedTranscribeJob {
  if (status === 429) {
    return {
      ok: false,
      status: 429,
      error: messageFromBody(
        body,
        'Someone else is transcribing. Try again in a little while.',
      ),
    };
  }
  if (status < 200 || status >= 300) {
    return {
      ok: false,
      status: status || 502,
      error: messageFromBody(body, `Transcription failed (${status || 502})`),
    };
  }
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const jobId = typeof record.id === 'string' ? record.id : '';
  if (!/^[a-f0-9]{32}$/.test(jobId)) {
    return {
      ok: false,
      status: 502,
      error: 'Transcription service returned an invalid job.',
    };
  }
  const jobStatus = typeof record.status === 'string' ? record.status : 'queued';
  return { ok: true, jobId, status: jobStatus };
}

export function readJobView(body: unknown): TranscribeJobView | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  const status = typeof record.status === 'string' ? record.status : '';
  if (!id || !status) return null;
  return {
    id,
    status,
    filename: typeof record.filename === 'string' ? record.filename : undefined,
    error: typeof record.error === 'string' ? record.error : null,
    result: record.result,
  };
}

export function isTerminalTranscribeStatus(status: string): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled';
}

export function transcribePhaseLabel(status: string): string {
  if (status === 'uploading') return 'Uploading…';
  if (status === 'queued') return 'Waiting…';
  if (status === 'running') return 'Transcribing…';
  return 'Transcribing…';
}

export function markdownFromJobResult(input: {
  filename: string;
  language?: string | null;
  result: unknown;
  transcribedAt?: Date;
}): { markdown: string; downloadName: string } {
  const normalized = toHkTraditionalResult(
    normalizeSttResponse(
      JSON.stringify(input.result ?? {}),
      input.language ?? undefined,
    ),
  );
  const filename = input.filename.trim() || 'audio';
  const markdown = buildTranscriptMarkdown({
    title: filename.replace(/\.[^.]+$/, '') || 'Transcript',
    originalFilename: filename,
    language: normalized.language || input.language,
    durationSeconds: normalized.duration,
    segments: normalized.segments,
    transcribedAt: input.transcribedAt,
  });
  return {
    markdown,
    downloadName: transcriptDownloadFilename(filename),
  };
}
