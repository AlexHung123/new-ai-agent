import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  displayFilename,
  extensionOf,
  isAudioUpload,
} from './audio-formats';
import { getSttConfig, isSttConfigured, type SttConfig } from './sttConfig';
import { transcribeFile } from './sttClient';
import {
  buildTranscriptMarkdown,
  transcriptDownloadFilename,
} from './transcriptFormat';

export type TranscribeError = {
  ok: false;
  status: number;
  error: string;
};

export type TranscribeSuccess = {
  ok: true;
  markdown: string;
  language?: string;
  durationSeconds?: number;
  filename: string;
  downloadName: string;
};

function formatByteLimit(bytes: number): string {
  if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024)} MB`;
  }
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  return `${bytes} bytes`;
}

function safeTempPath(filename: string): string {
  const ext = extensionOf(filename).replace(/[^a-z0-9]/g, '') || 'bin';
  const id = randomBytes(8).toString('hex');
  return join(tmpdir(), `stt-${id}.${ext}`);
}

async function writeUploadToTemp(file: File, dest: string): Promise<void> {
  try {
    const webStream = file.stream();
    await pipeline(
      Readable.fromWeb(webStream as import('node:stream/web').ReadableStream),
      createWriteStream(dest),
    );
  } catch {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  }
}

async function removeTemp(path: string | null) {
  if (!path) return;
  try {
    await unlink(path);
  } catch {
    // ignore missing file
  }
}

function readFormString(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

export async function transcribeUpload(
  form: FormData,
  options: { stt?: SttConfig } = {},
): Promise<TranscribeSuccess | TranscribeError> {
  const config = options.stt ?? getSttConfig();
  if (!isSttConfigured(config)) {
    return {
      ok: false,
      status: 400,
      error:
        'STT is not configured. Set stt.baseUrl in data/config.json (or stt.mock: true).',
    };
  }

  const uploaded = form.get('file');
  if (!(uploaded instanceof File)) {
    return { ok: false, status: 400, error: 'file is required' };
  }

  const filename = displayFilename(uploaded.name);
  if (uploaded.size <= 0) {
    return { ok: false, status: 400, error: 'This file is empty.' };
  }
  if (uploaded.size > config.maxUploadBytes) {
    return {
      ok: false,
      status: 400,
      error: `File must be ${formatByteLimit(config.maxUploadBytes)} or smaller`,
    };
  }
  if (!isAudioUpload(filename, uploaded.type)) {
    return {
      ok: false,
      status: 400,
      error:
        'This file type is not supported. Upload mp3, wav, m4a, mp4, flac, ogg, aac, webm, wma, or mkv.',
    };
  }

  const language = readFormString(form.get('language'));
  const tempPath = safeTempPath(filename);

  try {
    await writeUploadToTemp(uploaded, tempPath);
    const result = await transcribeFile(tempPath, config, { language });
    const title = filename.replace(/\.[^.]+$/, '') || 'Transcript';
    const markdown = buildTranscriptMarkdown({
      title,
      originalFilename: filename,
      language: result.language || language || config.defaultLanguage,
      durationSeconds: result.duration,
      segments: result.segments,
    });

    return {
      ok: true,
      markdown,
      language: result.language || language || config.defaultLanguage,
      durationSeconds: result.duration,
      filename,
      downloadName: transcriptDownloadFilename(filename),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('timed out')) {
      return { ok: false, status: 504, error: message };
    }
    if (message.startsWith('STT HTTP')) {
      return { ok: false, status: 502, error: message };
    }
    if (
      error instanceof TypeError ||
      message.includes('fetch') ||
      message.includes('ECONNREFUSED')
    ) {
      return {
        ok: false,
        status: 502,
        error: 'Speech-to-text server is not reachable.',
      };
    }
    return {
      ok: false,
      status: 502,
      error: message || 'Transcription failed',
    };
  } finally {
    await removeTemp(tempPath);
  }
}
