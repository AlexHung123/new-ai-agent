import * as fs from 'fs';
import * as path from 'path';
import type { SttConfig } from './sttConfig';
import { toHkTraditionalResult } from './traditionalChinese';
import {
  mapLanguageForStt,
  normalizeSttResponse,
  type SttResult,
} from './sttNormalize';

export type { SttResult } from './sttNormalize';

export type TranscribeFileOpts = {
  language?: string | null;
  spk?: boolean;
};

function guessMime(filename: string): string | undefined {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
  };
  return map[ext];
}

function mockResult(
  filePath: string,
  language: string,
  spk: boolean,
): SttResult {
  const name = path.basename(filePath);
  console.log(`STT mock: fake transcript for ${name} spk=${spk}`);
  return {
    text: '这是模拟转写结果。Hello from STT mock.',
    language,
    duration: 125,
    segments: [
      {
        start: 0,
        end: 12,
        text: '这是模拟转写结果。',
        speaker: spk ? 'spk0' : null,
      },
      {
        start: 12,
        end: 45,
        text: '会议讨论了登录改版与后端接口分工。',
        speaker: spk ? 'spk1' : null,
      },
      {
        start: 72,
        end: 125,
        text: 'Hello from STT mock. Action items follow next week.',
        speaker: spk ? 'spk0' : null,
      },
    ],
  };
}

async function fileToBlob(filePath: string, mime?: string): Promise<Blob> {
  try {
    const openAsBlob = (
      fs as unknown as {
        openAsBlob?: (p: string, opts?: { type?: string }) => Promise<Blob>;
      }
    ).openAsBlob;
    if (typeof openAsBlob === 'function') {
      return await openAsBlob(filePath, mime ? { type: mime } : undefined);
    }
  } catch {
    // fall through
  }
  return new Blob([fs.readFileSync(filePath)], {
    type: mime || 'application/octet-stream',
  });
}

export async function transcribeFile(
  filePath: string,
  config: SttConfig,
  opts?: TranscribeFileOpts,
): Promise<SttResult> {
  const language =
    (opts?.language || config.defaultLanguage || 'yue').trim() || undefined;
  const spk = typeof opts?.spk === 'boolean' ? opts.spk : config.spk;

  if (config.mock) {
    return toHkTraditionalResult(
      mockResult(filePath, language || config.defaultLanguage, spk),
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`audio file not found: ${filePath}`);
  }

  const filename = path.basename(filePath);
  const mime = guessMime(filename);
  const fileBlob = await fileToBlob(filePath, mime);
  const form = new FormData();
  form.append('file', fileBlob, filename);
  form.append('response_format', 'verbose_json');
  if (config.model) form.append('model', config.model);
  if (language) form.append('language', mapLanguageForStt(language));
  if (spk) form.append('spk', 'true');

  const headers: Record<string, string> = {};
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const url = `${config.baseUrl}/v1/audio/transcriptions`;
  console.log(
    `STT request model=${config.model || '-'} lang=${language || '-'} spk=${spk} file=${filename}`,
  );

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
      signal: controller.signal,
    });
    const textBody = await res.text();
    if (!res.ok) {
      throw new Error(
        `STT HTTP ${res.status}: ${textBody.slice(0, 500) || res.statusText}`,
      );
    }
    return toHkTraditionalResult(normalizeSttResponse(textBody, language));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`STT request timed out after ${config.timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
