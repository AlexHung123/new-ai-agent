import configManager from '@/lib/config';

export const DEFAULT_STT_BASE_URL = 'http://192.168.1.56:8002';
export const DEFAULT_STT_MODEL = 'sensevoice';
export const DEFAULT_STT_LANGUAGE = 'yue';
export const DEFAULT_STT_TIMEOUT_MS = 3_600_000;
export const DEFAULT_MAX_UPLOAD_BYTES = 2_073_741_824;

export type SttConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  defaultLanguage: string;
  timeoutMs: number;
  spk: boolean;
  mock: boolean;
  maxUploadBytes: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true' || lowered === '1') return true;
    if (lowered === 'false' || lowered === '0') return false;
  }
  return fallback;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function resolveSttConfig(stt: unknown): SttConfig {
  const section = isRecord(stt) ? stt : {};

  return {
    baseUrl: stripTrailingSlash(
      readNonEmptyString(section.baseUrl) ?? DEFAULT_STT_BASE_URL,
    ),
    apiKey: typeof section.apiKey === 'string' ? section.apiKey.trim() : '',
    model: readNonEmptyString(section.model) ?? DEFAULT_STT_MODEL,
    defaultLanguage:
      readNonEmptyString(section.defaultLanguage) ?? DEFAULT_STT_LANGUAGE,
    timeoutMs: parsePositiveInt(section.timeoutMs) ?? DEFAULT_STT_TIMEOUT_MS,
    spk: parseBoolean(section.spk, true),
    mock: parseBoolean(section.mock, false),
    maxUploadBytes:
      parsePositiveInt(section.maxUploadBytes) ?? DEFAULT_MAX_UPLOAD_BYTES,
  };
}

export function getSttConfig(): SttConfig {
  return resolveSttConfig(configManager.getConfig('stt'));
}

export function isSttConfigured(config: SttConfig): boolean {
  if (config.mock) return true;
  return Boolean(config.baseUrl.trim());
}
