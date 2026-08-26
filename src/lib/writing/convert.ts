import type { ConvertErrorCode, Format } from '@firecrawl/anydoc';
import {
  displayFilename,
  fileExtension,
  isAllowedWritingFilename,
  isImageFilename,
  isOfficeFilename,
  isPlainTextFilename,
  writingUnsupportedTypeMessage,
} from './types';

export type ConvertOk = {
  ok: true;
  markdown: string;
  format: string;
};

export type ConvertFail = {
  ok: false;
  error: string;
  code?: string;
};

export type ConvertResult = ConvertOk | ConvertFail;

export function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  const sample = bytes.subarray(0, Math.min(bytes.length, 8192));
  if (sample.includes(0)) return false;
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i]!;
    if (b === 9 || b === 10 || b === 13 || (b >= 32 && b !== 127) || b >= 0x80) {
      printable++;
    }
  }
  return printable / sample.length >= 0.85;
}

function decodeUtf8(bytes: Uint8Array): string {
  let buf = Buffer.from(bytes);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3);
  }
  return buf.toString('utf8');
}

export function convertErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'encrypted':
      return 'This file is encrypted or password-protected.';
    case 'unsupported':
      return 'This file cannot be converted. Scanned or image-only PDFs are not supported.';
    case 'malformed':
      return 'Could not extract text from this file.';
    case 'resourceLimit':
      return 'This file is too complex to convert.';
    case 'missingPart':
      return 'This file is incomplete and cannot be converted.';
    case 'io':
      return 'Could not read this file.';
    default:
      return 'Could not convert this file.';
  }
}

export async function convertAttachment(
  bytes: Uint8Array,
  filename: string,
): Promise<ConvertResult> {
  if (!isAllowedWritingFilename(filename)) {
    return {
      ok: false,
      error: writingUnsupportedTypeMessage(),
    };
  }

  const ext = fileExtension(filename) || 'txt';
  const name = displayFilename(filename);

  if (isImageFilename(filename)) {
    return {
      ok: true,
      markdown:
        `# ${name}\n\n` +
        `This is an image file (${ext}). Pixel content is not available as text.\n`,
      format: ext,
    };
  }

  if (isPlainTextFilename(filename) || (!isOfficeFilename(filename) && looksLikeText(bytes))) {
    if (!looksLikeText(bytes)) {
      return { ok: false, error: 'This text file looks binary and cannot be used.' };
    }
    const markdown = decodeUtf8(bytes);
    if (!markdown.trim()) {
      return { ok: false, error: 'This file is empty.' };
    }
    return { ok: true, markdown, format: ext };
  }

  try {
    const anydoc = await import('@firecrawl/anydoc');
    const fromExt = anydoc.formatFromExtension(ext);
    const fromBytes = anydoc.formatFromBytes(bytes);
    const format: Format | undefined = fromBytes ?? fromExt ?? undefined;
    const markdown = await anydoc.toMarkdownBytes(bytes, format ?? null);
    if (!markdown.trim()) {
      return { ok: false, error: 'Could not extract text from this file.' };
    }
    return {
      ok: true,
      markdown,
      format: format ?? (ext || 'document'),
    };
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: ConvertErrorCode }).code)
        : undefined;
    return { ok: false, error: convertErrorMessage(code), code };
  }
}
