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
      const similar = Array.isArray(rec.similar)
        ? rec.similar.filter((item): item is string => typeof item === 'string')
        : undefined;
      throw new DochubError(
        res.status,
        typeof rec.message === 'string' ? rec.message : 'Dochub request failed',
        typeof rec.error === 'string' ? rec.error : undefined,
        similar,
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
  deps?: DochubDeps & { path?: string },
): Promise<{
  user_id: string;
  tree: KnowledgeTreeNode;
}> {
  const { config } = depsOf(deps);
  const path = deps?.path ? `?path=${encodeURIComponent(deps.path)}` : '';
  return send(userId, `/v1/tree${path}`, { method: 'GET' }, config.timeoutMs, deps) as Promise<{
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

export type DochubSearchInput = {
  query?: string;
  mode: KnowledgeSearchMode;
  limit: number;
  path?: string;
  searches?: Array<{ type: string; query: string }>;
  intent?: string;
  rerank?: boolean;
  minScore?: number;
  candidateLimit?: number;
};

export type DochubSearchResult = {
  user_id: string;
  mode: string;
  query?: string;
  results: unknown[];
  intent?: string;
  searches?: unknown;
  keyword_search_ready?: boolean;
  semantic_search_ready?: boolean;
  hint?: string;
};

export async function search(
  userId: string,
  input: DochubSearchInput,
  deps?: DochubDeps,
): Promise<DochubSearchResult> {
  const { config } = depsOf(deps);
  const body: Record<string, unknown> = {
    mode: input.mode,
    limit: input.limit,
  };
  if (input.query) body.query = input.query;
  if (input.path) body.path = input.path;
  if (input.searches?.length) body.searches = input.searches;
  if (input.intent) body.intent = input.intent;
  if (typeof input.rerank === 'boolean') body.rerank = input.rerank;
  if (typeof input.minScore === 'number') body.minScore = input.minScore;
  if (typeof input.candidateLimit === 'number') body.candidateLimit = input.candidateLimit;
  return send(
    userId,
    '/v1/search',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    config.timeoutMs,
    deps,
  ) as Promise<DochubSearchResult>;
}

export type DochubDocument = {
  path: string;
  docid?: string | null;
  text: string;
  from_line?: number;
  max_lines?: number | null;
  line_count?: number;
  line_numbers?: boolean;
  bytes?: number;
};

export async function getDocument(
  userId: string,
  input: {
    path: string;
    fromLine?: number;
    maxLines?: number;
    maxBytes?: number;
    lineNumbers?: boolean;
  },
  deps?: DochubDeps,
): Promise<{ user_id: string; document: DochubDocument }> {
  const { config } = depsOf(deps);
  const params = new URLSearchParams({ path: input.path });
  if (input.fromLine != null) params.set('from_line', String(input.fromLine));
  if (input.maxLines != null) params.set('max_lines', String(input.maxLines));
  if (input.maxBytes != null) params.set('max_bytes', String(input.maxBytes));
  if (input.lineNumbers === false) params.set('line_numbers', '0');
  return send(
    userId,
    `/v1/documents?${params.toString()}`,
    { method: 'GET' },
    config.timeoutMs,
    deps,
  ) as Promise<{ user_id: string; document: DochubDocument }>;
}

export async function multiGetDocuments(
  userId: string,
  input: {
    files: string[];
    fromLine?: number;
    maxLines?: number;
    maxBytes?: number;
    lineNumbers?: boolean;
    path?: string;
  },
  deps?: DochubDeps,
): Promise<{
  user_id: string;
  path?: string | null;
  documents: DochubDocument[];
  errors: Array<{ file?: string; error?: string; message?: string; similar?: string[] }>;
}> {
  const { config } = depsOf(deps);
  const body: Record<string, unknown> = {
    files: input.files,
  };
  if (input.fromLine != null) body.from_line = input.fromLine;
  if (input.maxLines != null) body.max_lines = input.maxLines;
  if (input.maxBytes != null) body.max_bytes = input.maxBytes;
  if (input.lineNumbers === false) body.line_numbers = false;
  if (input.path) body.path = input.path;
  return send(
    userId,
    '/v1/documents/multi',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    config.timeoutMs,
    deps,
  ) as Promise<{
    user_id: string;
    path?: string | null;
    documents: DochubDocument[];
    errors: Array<{ file?: string; error?: string; message?: string; similar?: string[] }>;
  }>;
}

export type DochubIndexStatus = {
  keyword_search_ready?: boolean;
  semantic_search_ready?: boolean;
  hint?: string | null;
  queue?: Record<string, number>;
  ingest?: Record<string, unknown>;
  embedding_model?: unknown;
  collections?: unknown;
  contexts?: Array<{ path: string; text: string }>;
  qmd?: unknown;
};

export async function getStatus(
  userId: string,
  deps?: DochubDeps,
): Promise<{
  ok: boolean;
  service?: string;
  keyword_search_ready?: boolean;
  semantic_search_ready?: boolean;
  hint?: string | null;
  queue?: Record<string, number>;
  contexts?: Array<{ path: string; text: string }>;
  index?: DochubIndexStatus;
}> {
  const { config } = depsOf(deps);
  return send(userId, '/v1/status', { method: 'GET' }, config.timeoutMs, deps) as Promise<{
    ok: boolean;
    service?: string;
    keyword_search_ready?: boolean;
    semantic_search_ready?: boolean;
    hint?: string | null;
    queue?: Record<string, number>;
    contexts?: Array<{ path: string; text: string }>;
    index?: DochubIndexStatus;
  }>;
}

export async function getContext(
  userId: string,
  deps?: DochubDeps,
): Promise<{ contexts: Array<{ path: string; text: string }> }> {
  const { config } = depsOf(deps);
  return send(userId, '/v1/context', { method: 'GET' }, config.timeoutMs, deps) as Promise<{
    contexts: Array<{ path: string; text: string }>;
  }>;
}

export async function getHealth(
  deps?: DochubDeps,
): Promise<{ ok: boolean; service?: string }> {
  const { fetch: doFetch, config } = depsOf(deps);
  if (!isDochubConfigured(config)) throw unavailableError();
  try {
    const res = await doFetch(`${config.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    const body = await readJson(res);
    const rec =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    return {
      ok: rec.ok === true,
      service: typeof rec.service === 'string' ? rec.service : undefined,
    };
  } catch {
    throw unavailableError();
  }
}
