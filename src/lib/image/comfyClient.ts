import { SAVE_IMAGE_NODE_ID, type ComfyWorkflow } from './comfyWorkflow';

export const COMFY_UNREACHABLE = 'ComfyUI server is not reachable.';
export const COMFY_INVALID_SUBMIT = 'ComfyUI rejected the workflow.';
export const COMFY_NO_IMAGE = 'ComfyUI finished without an image.';

export type ComfyImageRef = {
  filename: string;
  subfolder: string;
  type: string;
};

export type ComfyJobPhase =
  | 'queued'
  | 'generating'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type ComfyHistoryResult =
  | { state: 'pending' }
  | { state: 'succeeded'; images: ComfyImageRef[] }
  | { state: 'failed'; error: string };

type FetchLike = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function joinComfyUrl(baseUrl: string, pathname: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${suffix}`;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback;
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
  if (typeof body.message === 'string' && body.message.trim())
    return body.message;
  return fallback;
}

function hasNodeErrors(body: unknown): boolean {
  if (!isRecord(body)) return false;
  const errors = body.node_errors;
  return isRecord(errors) && Object.keys(errors).length > 0;
}

function readImageRef(value: unknown): ComfyImageRef | null {
  if (!isRecord(value)) return null;
  const filename =
    typeof value.filename === 'string' ? value.filename.trim() : '';
  if (
    !filename ||
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    return null;
  }
  const subfolder =
    typeof value.subfolder === 'string'
      ? value.subfolder.replace(/^\/+|\/+$/g, '')
      : '';
  if (subfolder.includes('..')) return null;
  const type =
    typeof value.type === 'string' && value.type.trim()
      ? value.type.trim()
      : 'output';
  return { filename, subfolder, type };
}

export function imagesFromOutputs(outputs: unknown): ComfyImageRef[] {
  if (!isRecord(outputs)) return [];
  const preferred = outputs[SAVE_IMAGE_NODE_ID];
  const nodes =
    preferred != null
      ? [preferred, ...Object.values(outputs)]
      : Object.values(outputs);
  const images: ComfyImageRef[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    if (!isRecord(node) || !Array.isArray(node.images)) continue;
    for (const entry of node.images) {
      const ref = readImageRef(entry);
      if (!ref) continue;
      const key = `${ref.type}:${ref.subfolder}:${ref.filename}`;
      if (seen.has(key)) continue;
      seen.add(key);
      images.push(ref);
    }
  }
  return images;
}

function errorFromStatus(entry: Record<string, unknown>): string | null {
  const status = isRecord(entry.status) ? entry.status : null;
  if (status) {
    const statusStr =
      typeof status.status_str === 'string'
        ? status.status_str.toLowerCase()
        : '';
    if (statusStr === 'error' || statusStr === 'failed') {
      return messageFromMessages(status.messages) || 'Image generation failed.';
    }
  }
  const fromMessages = messageFromMessages(status?.messages ?? entry.messages);
  if (fromMessages) return fromMessages;
  return null;
}

function messageFromMessages(messages: unknown): string | null {
  if (!Array.isArray(messages)) return null;
  for (const item of messages) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const type = item[0];
    const payload = item[1];
    if (type === 'execution_error' && isRecord(payload)) {
      if (
        typeof payload.exception_message === 'string' &&
        payload.exception_message.trim()
      ) {
        return payload.exception_message;
      }
      return 'Image generation failed.';
    }
  }
  return null;
}

export function parseComfyHistory(
  body: unknown,
  promptId: string,
): ComfyHistoryResult {
  if (!isRecord(body)) return { state: 'pending' };
  const entry = body[promptId];
  if (!isRecord(entry)) return { state: 'pending' };

  const error = errorFromStatus(entry);
  if (error) return { state: 'failed', error };

  const images = imagesFromOutputs(entry.outputs);
  const status = isRecord(entry.status) ? entry.status : null;
  const completed =
    status?.completed === true || status?.status_str === 'success';
  if (images.length > 0) {
    return { state: 'succeeded', images };
  }
  if (completed) {
    return { state: 'failed', error: COMFY_NO_IMAGE };
  }
  return { state: 'pending' };
}

export function queuePhase(
  queue: unknown,
  promptId: string,
): 'queued' | 'generating' | null {
  if (!isRecord(queue)) return null;
  const running = Array.isArray(queue.queue_running) ? queue.queue_running : [];
  const pending = Array.isArray(queue.queue_pending) ? queue.queue_pending : [];
  const hasId = (items: unknown[]) =>
    items.some((item) => Array.isArray(item) && item[1] === promptId);
  if (hasId(running)) return 'generating';
  if (hasId(pending)) return 'queued';
  return null;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function requestJson(input: {
  fetchImpl: FetchLike;
  url: string;
  init?: RequestInit;
}): Promise<
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; error: string }
> {
  let response: Response;
  try {
    response = await input.fetchImpl(input.url, {
      cache: 'no-store',
      ...input.init,
    });
  } catch {
    return { ok: false, status: 502, error: COMFY_UNREACHABLE };
  }
  const body = await readJson(response);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status >= 400 ? response.status : 502,
      error: messageFromBody(
        body,
        `ComfyUI request failed (${response.status})`,
      ),
    };
  }
  return { ok: true, status: response.status, body };
}

export async function submitComfyPrompt(input: {
  baseUrl: string;
  workflow: ComfyWorkflow;
  clientId?: string;
  fetchImpl?: FetchLike;
}): Promise<
  { ok: true; promptId: string } | { ok: false; status: number; error: string }
> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const result = await requestJson({
    fetchImpl,
    url: joinComfyUrl(input.baseUrl, '/prompt'),
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: input.workflow,
        client_id: input.clientId ?? 'itms-agent-image',
      }),
    },
  });
  if (!result.ok) return result;
  if (hasNodeErrors(result.body)) {
    return { ok: false, status: 502, error: COMFY_INVALID_SUBMIT };
  }
  const promptId =
    isRecord(result.body) && typeof result.body.prompt_id === 'string'
      ? result.body.prompt_id.trim()
      : '';
  if (!promptId) {
    return { ok: false, status: 502, error: COMFY_INVALID_SUBMIT };
  }
  return { ok: true, promptId };
}

export async function readComfyHistory(input: {
  baseUrl: string;
  promptId: string;
  fetchImpl?: FetchLike;
}): Promise<
  | { ok: true; result: ComfyHistoryResult }
  | { ok: false; status: number; error: string }
> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const result = await requestJson({
    fetchImpl,
    url: joinComfyUrl(
      input.baseUrl,
      `/history/${encodeURIComponent(input.promptId)}`,
    ),
  });
  if (!result.ok) return result;
  return { ok: true, result: parseComfyHistory(result.body, input.promptId) };
}

export async function readComfyQueuePhase(input: {
  baseUrl: string;
  promptId: string;
  fetchImpl?: FetchLike;
}): Promise<ComfyJobPhase> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const result = await requestJson({
    fetchImpl,
    url: joinComfyUrl(input.baseUrl, '/queue'),
  });
  if (!result.ok) return 'generating';
  return queuePhase(result.body, input.promptId) ?? 'generating';
}

export async function cancelComfyJob(input: {
  baseUrl: string;
  promptId: string;
  fetchImpl?: FetchLike;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const interrupted = await requestJson({
    fetchImpl,
    url: joinComfyUrl(input.baseUrl, '/interrupt'),
    init: { method: 'POST' },
  });
  const deleted = await requestJson({
    fetchImpl,
    url: joinComfyUrl(input.baseUrl, '/queue'),
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ delete: [input.promptId] }),
    },
  });
  if (!interrupted.ok && !deleted.ok) {
    return interrupted;
  }
  return { ok: true };
}

export function viewQuery(ref: ComfyImageRef): string {
  const params = new URLSearchParams({
    filename: ref.filename,
    type: ref.type,
  });
  if (ref.subfolder) params.set('subfolder', ref.subfolder);
  return params.toString();
}

export function comfyViewUrl(baseUrl: string, ref: ComfyImageRef): string {
  return `${joinComfyUrl(baseUrl, '/view')}?${viewQuery(ref)}`;
}
