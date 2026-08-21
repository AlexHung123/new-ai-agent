import { DEFAULT_TTS_MODEL, isAllowedTtsModel } from './ttsModels';

export { DEFAULT_TTS_MODEL };
export const DEFAULT_TTS_BASE_URL = 'http://192.168.1.56:8020';
export const DEFAULT_TTS_MAX_TOKENS = 2000;
export const DEFAULT_RESPONSE_FORMAT = 'wav';
export const MAX_REF_AUDIO_BYTES = 10 * 1024 * 1024;

const AUDIO_MIME_TYPES = new Set([
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/webm',
  'audio/flac',
  'audio/ogg',
]);

export type TtsConfig = {
  baseUrl: string;
  model: string;
  maxTokens: number;
};

export type SpeechRequestInput = {
  input: string;
  refText: string;
  refAudioBytes: Uint8Array;
  refAudioMimeType: string;
  model?: string;
};

export type SpeechRequestError = {
  ok: false;
  status: number;
  error: string;
};

export type SpeechSuccess = {
  ok: true;
  audio: Uint8Array;
  contentType: string;
};

type EnvLike = Record<string, string | undefined>;

export function getTtsConfig(env: EnvLike = process.env): TtsConfig {
  const maxTokensRaw = env.TTS_MAX_TOKENS;
  const parsedTokens = maxTokensRaw ? Number.parseInt(maxTokensRaw, 10) : NaN;

  return {
    baseUrl: stripTrailingSlash(env.TTS_BASE_URL || DEFAULT_TTS_BASE_URL),
    model: env.TTS_MODEL || DEFAULT_TTS_MODEL,
    maxTokens:
      Number.isFinite(parsedTokens) && parsedTokens > 0
        ? parsedTokens
        : DEFAULT_TTS_MAX_TOKENS,
  };
}

export function encodeAudioDataUri(
  bytes: Uint8Array,
  mimeType: string,
): string {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
}

export function parseSpeechFields(fields: {
  input?: string | null;
  refText?: string | null;
  model?: string | null;
  file?: { bytes: Uint8Array; mimeType: string; name: string } | null;
}): { ok: true; data: SpeechRequestInput } | SpeechRequestError {
  const input = fields.input?.trim() ?? '';
  if (!input) {
    return { ok: false, status: 400, error: 'input is required' };
  }

  const refText = fields.refText?.trim() ?? '';

  if (!fields.file || fields.file.bytes.length === 0) {
    return { ok: false, status: 400, error: 'ref_audio is required' };
  }

  if (fields.file.bytes.length > MAX_REF_AUDIO_BYTES) {
    return {
      ok: false,
      status: 400,
      error: 'ref_audio must be 10 MB or smaller',
    };
  }

  const mimeType = normalizeAudioMimeType(
    fields.file.mimeType,
    fields.file.name,
  );
  if (!mimeType) {
    return {
      ok: false,
      status: 400,
      error: 'ref_audio must be an audio file',
    };
  }

  const model = fields.model?.trim() ?? '';
  if (model && !isAllowedTtsModel(model)) {
    return {
      ok: false,
      status: 400,
      error: 'model is not supported',
    };
  }

  return {
    ok: true,
    data: {
      input,
      refText,
      refAudioBytes: fields.file.bytes,
      refAudioMimeType: mimeType,
      ...(model ? { model } : {}),
    },
  };
}

export async function parseSpeechFormData(
  form: FormData,
): Promise<{ ok: true; data: SpeechRequestInput } | SpeechRequestError> {
  const fileValue = form.get('ref_audio');
  let file: { bytes: Uint8Array; mimeType: string; name: string } | null = null;

  if (fileValue instanceof File && fileValue.size > 0) {
    file = {
      bytes: new Uint8Array(await fileValue.arrayBuffer()),
      mimeType: fileValue.type,
      name: fileValue.name,
    };
  }

  return parseSpeechFields({
    input: readFormString(form.get('input')),
    refText: readFormString(form.get('ref_text')),
    model: readFormString(form.get('model')),
    file,
  });
}

export function buildVoxcpmSpeechBody(
  data: SpeechRequestInput,
  config: TtsConfig,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: data.model || config.model,
    input: data.input,
    ref_audio: encodeAudioDataUri(data.refAudioBytes, data.refAudioMimeType),
    response_format: DEFAULT_RESPONSE_FORMAT,
    max_tokens: config.maxTokens,
  };

  if (data.refText) {
    body.ref_text = data.refText;
  }

  return body;
}

export async function synthesizeSpeech(
  data: SpeechRequestInput,
  options: {
    fetchImpl?: typeof fetch;
    env?: EnvLike;
  } = {},
): Promise<SpeechSuccess | SpeechRequestError> {
  const config = getTtsConfig(options.env ?? process.env);
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${config.baseUrl}/v1/audio/speech`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildVoxcpmSpeechBody(data, config)),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error:
        'Voice server is not reachable. Start it with ./start_server.sh on port 8020.',
    };
  }

  if (!response.ok) {
    const upstream = await readUpstreamError(response);
    return {
      ok: false,
      status:
        response.status >= 400 && response.status < 600 ? response.status : 502,
      error: upstream || `Voice server returned ${response.status}`,
    };
  }

  const audio = new Uint8Array(await response.arrayBuffer());
  if (audio.length === 0) {
    return {
      ok: false,
      status: 502,
      error: 'Voice server returned empty audio',
    };
  }

  return {
    ok: true,
    audio,
    contentType: response.headers.get('Content-Type') || 'audio/wav',
  };
}

function readFormString(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' ? value : null;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeAudioMimeType(
  mimeType: string | undefined,
  fileName: string,
): string | null {
  const lowered = (mimeType || '').toLowerCase().split(';')[0]?.trim();
  if (lowered && AUDIO_MIME_TYPES.has(lowered)) {
    return lowered === 'audio/wave' || lowered === 'audio/x-wav'
      ? 'audio/wav'
      : lowered;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'm4a') return 'audio/mp4';
  if (extension === 'webm') return 'audio/webm';
  if (extension === 'flac') return 'audio/flac';
  if (extension === 'ogg') return 'audio/ogg';
  return null;
}

async function readUpstreamError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return '';
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string } | string;
      detail?: unknown;
    };
    if (typeof json.error === 'string') return json.error;
    if (json.error?.message) return json.error.message;
    const detail = formatFastApiDetail(json.detail);
    if (detail) return detail;
  } catch {
    return text.slice(0, 500);
  }
  return text.slice(0, 500);
}

function formatFastApiDetail(detail: unknown): string {
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          const message = (item as { msg?: unknown }).msg;
          return typeof message === 'string' ? message : '';
        }
        return '';
      })
      .filter(Boolean);
    if (messages.length) return messages.join('; ');
  }
  return '';
}
