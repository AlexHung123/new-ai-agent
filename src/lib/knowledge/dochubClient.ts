import {
  getDochubConfig,
  isDochubConfigured,
} from './config';
import { DochubError, unavailableError } from './errors';
import { markdownName } from './paths';
import type {
  DochubConfig,
  KnowledgeSearchMode,
  KnowledgeTask,
  KnowledgeTreeNode,
} from './types';

export type DochubDeps = {
  fetch?: typeof fetch;
  config?: DochubConfig;
};

function depsOf(deps?: DochubDeps): {
  fetch: typeof fetch;
  config: DochubConfig;
} {
  return {
    fetch: deps?.fetch ?? fetch,
    config: deps?.config ?? getDochubConfig(),
  };
}

function userHeaders(userId: string, extra?: Record<string, string>): Headers {
  const headers = new Headers(extra);
  headers.set('X-User-Id', userId);
  headers.delete('Authorization');
  return headers;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function send(
  userId: string,
  path: string,
  init: RequestInit,
  timeoutMs: number,
  deps?: DochubDeps,
): Promise<unknown> {
  const { fetch: doFetch, config } = depsOf(deps);
  if (!isDochubConfigured(config)) throw unavailableError();
  const url = `${config.baseUrl}${path}`;
  const headers = userHeaders(
    userId,
    init.headers
      ? Object.fromEntries(new Headers(init.headers).entries())
      : undefined,
  );
  try {
    const res = await doFetch(url, {
      ...init,
      headers,
      signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    });
    const body = await readJson(res);
    if (res.status >= 400) {
      const rec =
        body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
      throw new DochubError(
        res.status,
        typeof rec.message === 'string' ? rec.message : 'Dochub request failed',
        typeof rec.error === 'string' ? rec.error : undefined,
      );
    }
    return body;
  } catch (error) {
    if (error instanceof DochubError) throw error;
    throw unavailableError();
  }
}

export async function getTree(
  userId: string,
  deps?: DochubDeps,
): Promise<{
  user_id: string;
  tree: KnowledgeTreeNode;
}> {
  const { config } = depsOf(deps);
  return send(userId, '/v1/tree', { method: 'GET' }, config.timeoutMs, deps) as Promise<{
    user_id: string;
    tree: KnowledgeTreeNode;
  }>;
}

export async function createFolder(
  userId: string,
  path: string,
  deps?: DochubDeps,
): Promise<{ path: string }> {
  const { config } = depsOf(deps);
  return send(
    userId,
    '/v1/folders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    },
    config.timeoutMs,
    deps,
  ) as Promise<{ path: string }>;
}

export async function uploadFile(
  userId: string,
  input: {
    original: Uint8Array;
    originalName: string;
    originalType?: string;
    markdown: string;
    relativePath: string;
  },
  deps?: DochubDeps,
): Promise<{ file: { id: string } & Record<string, unknown>; task: KnowledgeTask }> {
  const { config } = depsOf(deps);
  const form = new FormData();
  form.set(
    'file',
    new File([input.original], input.originalName, {
      type: input.originalType || 'application/octet-stream',
    }),
  );
  form.set(
    'markdown',
    new File([input.markdown], markdownName(input.originalName), {
      type: 'text/markdown',
    }),
  );
  form.set('relative_path', input.relativePath);
  return send(
    userId,
    '/v1/files',
    { method: 'POST', body: form },
    config.uploadTimeoutMs,
    deps,
  ) as Promise<{
    file: { id: string } & Record<string, unknown>;
    task: KnowledgeTask;
  }>;
}

export async function getTask(
  userId: string,
  taskId: string,
  deps?: DochubDeps,
): Promise<{ task: KnowledgeTask }> {
  const { config } = depsOf(deps);
  return send(
    userId,
    `/v1/tasks/${encodeURIComponent(taskId)}`,
    { method: 'GET' },
    config.timeoutMs,
    deps,
  ) as Promise<{ task: KnowledgeTask }>;
}

export async function getFileContent(
  userId: string,
  fileId: string,
  tree: 'markdown' | 'inbox',
  deps?: DochubDeps,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const { fetch: doFetch, config } = depsOf(deps);
  if (!isDochubConfigured(config)) throw unavailableError();
  try {
    const res = await doFetch(
      `${config.baseUrl}/v1/files/${encodeURIComponent(fileId)}/content?tree=${tree}`,
      {
        method: 'GET',
        headers: userHeaders(userId),
        signal: AbortSignal.timeout(config.timeoutMs),
      },
    );
    if (res.status >= 400) {
      const body = await readJson(res);
      const rec =
        body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
      throw new DochubError(
        res.status,
        typeof rec.message === 'string' ? rec.message : 'file not found',
        typeof rec.error === 'string' ? rec.error : undefined,
      );
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      bytes: buf,
      contentType: res.headers.get('content-type') || 'application/octet-stream',
    };
  } catch (error) {
    if (error instanceof DochubError) throw error;
    throw unavailableError();
  }
}

export async function search(
  userId: string,
  input: { query: string; mode: KnowledgeSearchMode; limit: number },
  deps?: DochubDeps,
): Promise<{
  user_id: string;
  mode: string;
  query: string;
  results: unknown[];
}> {
  const { config } = depsOf(deps);
  return send(
    userId,
    '/v1/search',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    config.timeoutMs,
    deps,
  ) as Promise<{
    user_id: string;
    mode: string;
    query: string;
    results: unknown[];
  }>;
}
