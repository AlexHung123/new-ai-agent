import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  uploadErrorMessage,
  uploadKnowledgeFile,
  uploadParseLabel,
  uploadProgressPercent,
  uploadTaskFromBody,
  visibleKnowledgeUploads,
  type KnowledgeUploadItem,
} from './uploadFile';

type ProgressEventLike = {
  lengthComputable: boolean;
  loaded: number;
  total: number;
};

class MockXHR {
  static last: MockXHR | null = null;
  static behavior: 'success' | 'error' | 'timeout' | 'http-error' | 'uncomputable' =
    'success';

  upload: { onprogress: ((event: ProgressEventLike) => void) | null } = {
    onprogress: null,
  };
  status = 0;
  responseText = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  headers: Record<string, string> = {};
  method = '';
  url = '';
  body: FormData | null = null;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  send(body: FormData) {
    this.body = body;
    MockXHR.last = this;
    queueMicrotask(() => {
      if (MockXHR.behavior === 'error') {
        this.onerror?.();
        return;
      }
      if (MockXHR.behavior === 'timeout') {
        this.ontimeout?.();
        return;
      }
      if (MockXHR.behavior === 'uncomputable') {
        this.upload.onprogress?.({
          lengthComputable: false,
          loaded: 10,
          total: 0,
        });
        this.status = 202;
        this.responseText = JSON.stringify({ task: { id: 't1', status: 'pending' } });
        this.onload?.();
        return;
      }
      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: 40,
        total: 160,
      });
      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: 160,
        total: 160,
      });
      if (MockXHR.behavior === 'http-error') {
        this.status = 400;
        this.responseText = JSON.stringify({ message: 'This file is too large.' });
        this.onload?.();
        return;
      }
      this.status = 202;
      this.responseText = JSON.stringify({
        file: { id: 'f1' },
        task: { id: 't1', status: 'pending' },
      });
      this.onload?.();
    });
  }
}

describe('uploadParseLabel and progress', () => {
  it('shows Uploading until a known in-flight percent is available', () => {
    expect(uploadParseLabel(null)).toBe('Uploading');
    expect(uploadParseLabel(0)).toBe('0%');
    expect(uploadParseLabel(42)).toBe('42%');
    expect(uploadParseLabel(99)).toBe('99%');
    expect(uploadParseLabel(100)).toBe('Uploading');
    expect(uploadParseLabel(80, 'processing')).toBe('Uploading');
  });

  it('computes a clamped percent only when the total is known', () => {
    expect(uploadProgressPercent(40, 160)).toBe(25);
    expect(uploadProgressPercent(160, 160)).toBe(100);
    expect(uploadProgressPercent(10, 0)).toBeNull();
    expect(uploadProgressPercent(Number.NaN, 100)).toBeNull();
    expect(uploadProgressPercent(200, 100)).toBe(100);
    expect(uploadProgressPercent(-4, 100)).toBe(0);
  });
});

describe('visibleKnowledgeUploads', () => {
  const uploads: KnowledgeUploadItem[] = [
    {
      id: 'u1',
      name: 'a.pdf',
      sizeBytes: 10,
      folderPath: 'contracts',
      library: 'private',
      progress: 12,
      status: 'uploading',
    },
    {
      id: 'u2',
      name: 'b.pdf',
      sizeBytes: 20,
      folderPath: '',
      library: 'private',
      progress: null,
      status: 'uploading',
    },
    {
      id: 'u3',
      name: 'c.pdf',
      sizeBytes: 30,
      folderPath: 'contracts',
      library: 'public',
      progress: null,
      status: 'processing',
    },
  ];

  it('keeps only uploads for the current folder and library', () => {
    expect(visibleKnowledgeUploads(uploads, 'contracts', 'private').map((item) => item.id)).toEqual(
      ['u1'],
    );
    expect(visibleKnowledgeUploads(uploads, '', 'private').map((item) => item.id)).toEqual(
      ['u2'],
    );
    expect(visibleKnowledgeUploads(uploads, 'contracts', 'public').map((item) => item.id)).toEqual(
      ['u3'],
    );
  });
});

describe('upload response helpers', () => {
  it('reads a task id and error message from the JSON body', () => {
    expect(uploadTaskFromBody({ task: { id: 't1', status: 'pending' } })?.id).toBe(
      't1',
    );
    expect(uploadTaskFromBody({})).toBeNull();
    expect(uploadTaskFromBody({ task: { id: 1 } })).toBeNull();
    expect(uploadErrorMessage({ message: 'This file is too large.' })).toBe(
      'This file is too large.',
    );
    expect(uploadErrorMessage({})).toBe('Could not upload this file');
  });
});

describe('uploadKnowledgeFile', () => {
  const OriginalXHR = globalThis.XMLHttpRequest;

  afterEach(() => {
    MockXHR.last = null;
    MockXHR.behavior = 'success';
    if (OriginalXHR) {
      globalThis.XMLHttpRequest = OriginalXHR;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest;
    }
  });

  it('POSTs the same FormData fields and auth headers, and reports progress', async () => {
    globalThis.XMLHttpRequest =
      MockXHR as unknown as typeof XMLHttpRequest;
    const percents: Array<number | null> = [];
    const file = new File(['hello'], 'notes.md', { type: 'text/markdown' });
    const result = await uploadKnowledgeFile({
      url: '/itms/ai/api/knowledge/files',
      file,
      relativePath: 'docs/notes.md',
      library: 'private',
      headers: {
        Authorization: 'Bearer token-1',
        'Content-Type': 'application/json',
      },
      onProgress: (percent) => percents.push(percent),
    });

    expect(MockXHR.last?.method).toBe('POST');
    expect(MockXHR.last?.url).toBe('/itms/ai/api/knowledge/files');
    expect(MockXHR.last?.headers.Authorization).toBe('Bearer token-1');
    expect(MockXHR.last?.headers['Content-Type']).toBeUndefined();
    const body = MockXHR.last?.body;
    expect(body).toBeInstanceOf(FormData);
    const sentFile = body?.get('file');
    expect(sentFile).toBeInstanceOf(File);
    expect((sentFile as File).name).toBe('notes.md');
    expect(body?.get('relative_path')).toBe('docs/notes.md');
    expect(body?.get('library')).toBe('private');
    expect(percents).toEqual([25, 100]);
    expect(result).toEqual({
      ok: true,
      status: 202,
      body: { file: { id: 'f1' }, task: { id: 't1', status: 'pending' } },
    });
  });

  it('returns an HTTP error body without throwing', async () => {
    globalThis.XMLHttpRequest =
      MockXHR as unknown as typeof XMLHttpRequest;
    MockXHR.behavior = 'http-error';
    const result = await uploadKnowledgeFile({
      url: '/itms/ai/api/knowledge/files',
      file: new File(['x'], 'notes.md'),
      relativePath: 'notes.md',
      library: 'private',
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ message: 'This file is too large.' });
  });

  it('rejects on a network error', async () => {
    globalThis.XMLHttpRequest =
      MockXHR as unknown as typeof XMLHttpRequest;
    MockXHR.behavior = 'error';
    await expect(
      uploadKnowledgeFile({
        url: '/itms/ai/api/knowledge/files',
        file: new File(['x'], 'notes.md'),
        relativePath: 'notes.md',
        library: 'private',
      }),
    ).rejects.toThrow('Could not upload this file');
  });
});
