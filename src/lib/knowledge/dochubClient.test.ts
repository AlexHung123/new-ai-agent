import { afterEach, describe, expect, it, vi } from 'vitest';
import { DochubError } from './errors';
import {
  createFolder,
  getHealth,
  getTree,
  search,
  uploadFile,
} from './dochubClient';
import { DOCHUB_UNAVAILABLE_MESSAGE } from './config';

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const config = {
  baseUrl: 'http://dochub.test',
  timeoutMs: 1000,
  uploadTimeoutMs: 2000,
  maxUploadBytes: 1024,
  maxUserBytes: 5 * 1024 * 1024 * 1024,
  userQuotaBytes: {},
};

describe('dochubClient', () => {
  it('sets X-User-Id from the argument and never sends Authorization', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        user_id: '1',
        tree: { type: 'dir', name: '', path: '', children: [] },
      }),
    );
    await getTree('1', { fetch: fetchMock, config });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('X-User-Id')).toBe('1');
    expect(headers.get('Authorization')).toBeNull();
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://dochub.test/v1/tree');
  });

  it('uses the userId argument even if a JSON body also names a user', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { path: 'docs' }));
    await createFolder('1', 'docs', { fetch: fetchMock, config });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-User-Id')).toBe('1');
    expect(init.body).toBe(JSON.stringify({ path: 'docs' }));
  });

  it('treats upload HTTP 202 as success and sends file, markdown, relative_path', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = init?.body as FormData;
      expect(body.get('relative_path')).toBe('contracts/2024/report.pdf');
      expect(body.get('file')).toBeInstanceOf(File);
      expect(body.get('markdown')).toBeInstanceOf(File);
      return jsonResponse(202, {
        file: { id: 'f1' },
        task: { id: 't1', status: 'pending' },
      });
    });
    const result = await uploadFile(
      '1',
      {
        original: new Uint8Array([1, 2, 3]),
        originalName: 'report.pdf',
        originalType: 'application/pdf',
        markdown: '# Report',
        relativePath: 'contracts/2024/report.pdf',
      },
      { fetch: fetchMock, config },
    );
    expect(result.file.id).toBe('f1');
    expect(result.task.id).toBe('t1');
  });

  it('maps a fetch throw to unavailable 503', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(getTree('1', { fetch: fetchMock, config })).rejects.toMatchObject({
      status: 503,
      message: DOCHUB_UNAVAILABLE_MESSAGE,
    });
  });

  it('throws DochubError with Dochub error/message on 4xx JSON', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(404, { error: 'not_found', message: 'file not found' }),
    );
    await expect(
      search('1', { query: 'q', mode: 'search', limit: 10 }, { fetch: fetchMock, config }),
    ).rejects.toBeInstanceOf(DochubError);
  });

  it('forwards optional search path and omits it when unset', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { user_id: '1', mode: 'search', query: 'q', results: [] }),
    );
    await search(
      '1',
      { query: 'q', mode: 'search', limit: 5, path: 'contracts/2024' },
      { fetch: fetchMock, config },
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      query: 'q',
      mode: 'search',
      limit: 5,
      path: 'contracts/2024',
    });
    fetchMock.mockClear();
    await search('1', { query: 'q', mode: 'search', limit: 5 }, { fetch: fetchMock, config });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      query: 'q',
      mode: 'search',
      limit: 5,
    });
  });

  it('getHealth calls /health without X-User-Id', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { ok: true, service: 'dochub' }),
    );
    await expect(getHealth({ fetch: fetchMock, config })).resolves.toEqual({
      ok: true,
      service: 'dochub',
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://dochub.test/health');
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('X-User-Id')).toBeNull();
  });

  it('throws unavailable when baseUrl is empty', async () => {
    await expect(
      getTree('1', {
        fetch: vi.fn(),
        config: { ...config, baseUrl: '' },
      }),
    ).rejects.toMatchObject({
      status: 503,
      message: DOCHUB_UNAVAILABLE_MESSAGE,
    });
  });
});
