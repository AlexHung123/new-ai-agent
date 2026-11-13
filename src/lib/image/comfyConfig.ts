import path from 'node:path';
import configManager from '@/lib/config';

export const DEFAULT_COMFY_BASE_URL = 'http://127.0.0.1:8188';
export const DEFAULT_COMFY_TIMEOUT_MS = 600_000;
export const DEFAULT_COMFY_WORKFLOW_PATH = 'data/comfy/minimax_h3_t2i.json';

export type ComfyConfig = {
  baseUrl: string;
  timeoutMs: number;
  workflowPath: string;
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

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function resolveComfyConfig(comfy: unknown): ComfyConfig {
  const section = isRecord(comfy) ? comfy : {};

  return {
    baseUrl: stripTrailingSlash(
      readNonEmptyString(section.baseUrl) ?? DEFAULT_COMFY_BASE_URL,
    ),
    timeoutMs: parsePositiveInt(section.timeoutMs) ?? DEFAULT_COMFY_TIMEOUT_MS,
    workflowPath:
      readNonEmptyString(section.workflowPath) ?? DEFAULT_COMFY_WORKFLOW_PATH,
  };
}

export function getComfyConfig(): ComfyConfig {
  return resolveComfyConfig(configManager.getConfig('comfy'));
}

export function resolveWorkflowFilePath(
  workflowPath: string,
  rootDir: string = process.env.DATA_DIR || process.cwd(),
): string {
  if (path.isAbsolute(workflowPath)) return workflowPath;
  return path.join(rootDir, workflowPath);
}

export function isComfyConfigured(config: ComfyConfig): boolean {
  return Boolean(config.baseUrl.trim());
}
