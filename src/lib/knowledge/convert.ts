import {
  convertAttachment,
  type ConvertResult,
} from '@/lib/writing/convert';
import { fileExtension } from '@/lib/writing/types';
import { DEFAULT_DOCHUB_MAX_UPLOAD_BYTES } from './config';
import {
  KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedKnowledgeFilename,
  isKnowledgeTextFilename,
} from './filenames';

export {
  KNOWLEDGE_ACCEPT,
  KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedKnowledgeFilename,
  isKnowledgeTextFilename,
} from './filenames';

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
