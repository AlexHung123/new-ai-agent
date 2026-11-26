export type KnowledgeUploadStatus = 'uploading' | 'processing';

export type KnowledgeUploadItem = {
  id: string;
  name: string;
  sizeBytes: number;
  folderPath: string;
  library: 'private' | 'public';
  progress: number | null;
  status: KnowledgeUploadStatus;
};

export type KnowledgeUploadResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

export function createKnowledgeUploadId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uploadProgressPercent(
  loaded: number,
  total: number,
): number | null {
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
}

export function uploadParseLabel(
  progress: number | null,
  status: KnowledgeUploadStatus = 'uploading',
): string {
  if (
    status !== 'processing' &&
    typeof progress === 'number' &&
    Number.isFinite(progress) &&
    progress >= 0 &&
    progress < 100
  ) {
    return `${Math.round(progress)}%`;
  }
  return 'Uploading';
}

export function visibleKnowledgeUploads(
  uploads: KnowledgeUploadItem[],
  folderPath: string,
  library: 'private' | 'public',
): KnowledgeUploadItem[] {
  return uploads.filter(
    (item) => item.library === library && item.folderPath === folderPath,
  );
}

function applyHeaders(xhr: XMLHttpRequest, headers?: HeadersInit) {
  if (!headers) return;
  const skip = (key: string) => key.toLowerCase() === 'content-type';
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      if (!skip(key)) xhr.setRequestHeader(key, value);
    });
    return;
  }
  const entries = Array.isArray(headers)
    ? headers
    : Object.entries(headers).flatMap(([key, value]) =>
        value == null
          ? []
          : Array.isArray(value)
            ? value.map((item) => [key, item] as [string, string])
            : [[key, String(value)] as [string, string]],
      );
  for (const [key, value] of entries) {
    if (!skip(key)) xhr.setRequestHeader(key, value);
  }
}

function parseJsonBody(text: string): Record<string, unknown> {
  try {
    const value = JSON.parse(text) as unknown;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export function uploadTaskFromBody(
  body: Record<string, unknown>,
): ({ id: string } & Record<string, unknown>) | null {
  const task = body.task;
  if (!task || typeof task !== 'object' || Array.isArray(task)) return null;
  const id = (task as { id?: unknown }).id;
  if (typeof id !== 'string' || !id) return null;
  return task as { id: string } & Record<string, unknown>;
}

export function uploadErrorMessage(
  body: Record<string, unknown>,
  fallback = 'Could not upload this file',
): string {
  return typeof body.message === 'string' && body.message.trim()
    ? body.message
    : fallback;
}

export function uploadKnowledgeFile(options: {
  url: string;
  file: File;
  relativePath: string;
  library: string;
  headers?: HeadersInit;
  onProgress?: (percent: number | null) => void;
}): Promise<KnowledgeUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', options.url);
    applyHeaders(xhr, options.headers);

    xhr.upload.onprogress = (event) => {
      if (!options.onProgress) return;
      if (!event.lengthComputable) {
        options.onProgress(null);
        return;
      }
      options.onProgress(uploadProgressPercent(event.loaded, event.total));
    };

    xhr.onload = () => {
      const body = parseJsonBody(xhr.responseText);
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        body,
      });
    };
    xhr.onerror = () => reject(new Error('Could not upload this file'));
    xhr.ontimeout = () => reject(new Error('Could not upload this file'));

    const form = new FormData();
    form.set('file', options.file, options.file.name);
    form.set('relative_path', options.relativePath);
    form.set('library', options.library);
    xhr.send(form);
  });
}
