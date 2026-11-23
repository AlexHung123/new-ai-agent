import configManager from '@/lib/config';
import { DEFAULT_MAX_USER_BYTES } from './storage';
import type { DochubConfig } from './types';

export const DEFAULT_DOCHUB_BASE_URL = 'http://192.168.1.56:8787';
export const DEFAULT_DOCHUB_TIMEOUT_MS = 60_000;
export const DEFAULT_DOCHUB_UPLOAD_TIMEOUT_MS = 120_000;
export const DEFAULT_DOCHUB_MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
export const DOCHUB_UNAVAILABLE_MESSAGE =
  'Knowledge service is unavailable.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim();
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

function parseNonNegativeInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

function parseQuotaMap(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const parsed = parseNonNegativeInt(value);
    if (parsed !== undefined) out[key] = parsed;
  }
  return out;
}

export function resolveDochubConfig(raw: unknown): DochubConfig {
  const section = isRecord(raw) ? raw : {};
  const provided = Object.prototype.hasOwnProperty.call(section, 'baseUrl');
  const trimmed = provided ? (readString(section.baseUrl) ?? '') : undefined;

  return {
    baseUrl: (trimmed ?? DEFAULT_DOCHUB_BASE_URL).replace(/\/+$/, ''),
    timeoutMs: parsePositiveInt(section.timeoutMs) ?? DEFAULT_DOCHUB_TIMEOUT_MS,
    uploadTimeoutMs:
      parsePositiveInt(section.uploadTimeoutMs) ??
      DEFAULT_DOCHUB_UPLOAD_TIMEOUT_MS,
    maxUploadBytes:
      parsePositiveInt(section.maxUploadBytes) ??
      DEFAULT_DOCHUB_MAX_UPLOAD_BYTES,
    maxUserBytes:
      parseNonNegativeInt(section.maxUserBytes) ?? DEFAULT_MAX_USER_BYTES,
    userQuotaBytes: parseQuotaMap(section.userQuotaBytes),
  };
}

export function isDochubConfigured(config: DochubConfig): boolean {
  return Boolean(config.baseUrl.trim());
}

export function getDochubConfig(): DochubConfig {
  return resolveDochubConfig(configManager.getConfig('dochub', undefined));
}
