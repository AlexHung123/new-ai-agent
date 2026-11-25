import { existsSync, readFileSync } from 'node:fs';
import { fileExtension } from './types';
import { writingRawAbs } from './paths';
import { listWritingAttachments } from './store';

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  docm: 'application/vnd.ms-word.document.macroEnabled.12',
  dot: 'application/msword',
  rtf: 'application/rtf',
  odt: 'application/vnd.oasis.opendocument.text',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
  xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  csv: 'text/csv',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pptm: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  pps: 'application/vnd.ms-powerpoint',
  ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  odp: 'application/vnd.oasis.opendocument.presentation',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
};

export type ReadWritingOriginalResult =
  | {
      ok: true;
      name: string;
      bytes: Buffer;
      contentType: string;
    }
  | { ok: false; status: number; message: string };

export function contentTypeForFilename(
  filename: string,
  fallback?: string,
): string {
  const ext = fileExtension(filename);
  return MIME_BY_EXT[ext] || fallback || 'application/octet-stream';
}

export function contentDispositionInline(filename: string): string {
  const raw = (filename || 'download').replace(/["\r\n]/g, '_');
  const ascii = raw.replace(/[^\x20-\x7E]/g, '_') || 'download';
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(raw)}`;
}

export function readWritingOriginalFile(
  userId: string,
  fileId: string,
): ReadWritingOriginalResult {
  const owner = (userId || '').trim();
  const id = (fileId || '').trim();
  if (!owner) {
    return { ok: false, status: 401, message: 'Missing user id' };
  }
  if (!id) {
    return { ok: false, status: 400, message: 'fileId is required' };
  }

  const item = listWritingAttachments(owner).find((file) => file.fileId === id);
  if (!item) {
    return { ok: false, status: 404, message: 'File not found' };
  }

  const abs = writingRawAbs(owner, item.fileId, item.name);
  if (!existsSync(abs)) {
    return { ok: false, status: 404, message: 'Original file is missing' };
  }

  return {
    ok: true,
    name: item.name,
    bytes: readFileSync(abs),
    contentType: contentTypeForFilename(item.name, item.mimeType),
  };
}
