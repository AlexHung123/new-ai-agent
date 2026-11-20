import {
  convertAttachment,
  type ConvertResult,
} from '@/lib/writing/convert';
import {
  fileExtension,
  isOfficeFilename,
} from '@/lib/writing/types';
import { DEFAULT_DOCHUB_MAX_UPLOAD_BYTES } from './config';

const TEXT_EXT = new Set(['md', 'markdown', 'txt']);

export const KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE =
  'This file type is not supported. Attach Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, PDF, Markdown, or text files.';

export const KNOWLEDGE_ACCEPT = [
  ...['doc', 'docx', 'docm', 'ppt', 'pps', 'pot', 'pptx', 'pptm', 'ppsx', 'ppsm',
    'xls', 'xlsx', 'xlsm', 'xlsb', 'odt', 'ods', 'odp', 'rtf', 'epub', 'csv', 'pdf',
    'md', 'markdown', 'txt'],
].map((ext) => `.${ext}`).join(',');

export function isKnowledgeTextFilename(filename: string): boolean {
  return TEXT_EXT.has(fileExtension(filename));
}

export function isAllowedKnowledgeFilename(filename: string): boolean {
  return isOfficeFilename(filename) || isKnowledgeTextFilename(filename);
}

function decodeUtf8(bytes: Uint8Array): string {
  let buf = Buffer.from(bytes);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3);
  }
  return buf.toString('utf8');
}

export async function convertKnowledgeAttachment(
  bytes: Uint8Array,
  filename: string,
  options?: { maxBytes?: number },
): Promise<ConvertResult> {
  const maxBytes = options?.maxBytes ?? DEFAULT_DOCHUB_MAX_UPLOAD_BYTES;
  if (bytes.byteLength > maxBytes) {
    return { ok: false, error: 'This file is too large.' };
  }
  if (!isAllowedKnowledgeFilename(filename)) {
    return { ok: false, error: KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE };
  }
  if (isKnowledgeTextFilename(filename)) {
    const markdown = decodeUtf8(bytes);
    if (!markdown.trim()) {
      return { ok: false, error: 'This file is empty.' };
    }
    return { ok: true, markdown, format: fileExtension(filename) || 'txt' };
  }
  return convertAttachment(bytes, filename);
}
