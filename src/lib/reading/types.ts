export const MAX_READING_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_READING_FILES = 8;
export const MAX_READING_QUOTE_CHARS = 4000;

export function readingFileLimitMessage(): string {
  return `At most ${MAX_READING_FILES} PDFs per user.`;
}

export function readingUnsupportedTypeMessage(): string {
  return 'Agent Reader only accepts PDF files.';
}

export const READING_ACCEPT = '.pdf,application/pdf';

export type ReadingAttachmentStatus = 'ready' | 'failed';

export type ReadingAttachment = {
  fileId: string;
  userId: string;
  name: string;
  status: ReadingAttachmentStatus;
  relDir: string;
  parts: number;
  charCount: number;
  format: string;
  mimeType?: string;
  sizeBytes?: number;
  error?: string;
  createdAt: string;
};

export type ReadingAttachmentView = {
  fileId: string;
  name: string;
  status: 'uploading' | ReadingAttachmentStatus;
  parts?: number;
  charCount?: number;
  format?: string;
  sizeBytes?: number;
  error?: string;
};

export type ReaderMarkKind = 'highlight' | 'ask';

export type ReaderMark = {
  id: string;
  kind: ReaderMarkKind;
  page: number;
  quote: string;
  question?: string;
  createdAt: string;
};

export type ReaderSelection = {
  quote: string;
  page: number;
  fileName?: string;
};

export function toPublicReadingAttachment(
  item: ReadingAttachment,
): ReadingAttachmentView {
  return {
    fileId: item.fileId,
    name: item.name,
    status: item.status,
    parts: item.parts,
    charCount: item.charCount,
    format: item.format,
    sizeBytes: item.sizeBytes,
    error: item.error,
  };
}

export function formatReadingBytes(n: number | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() || '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return '';
  return base.slice(dot + 1).toLowerCase();
}

export function isPdfFilename(filename: string): boolean {
  return fileExtension(filename) === 'pdf';
}

export function displayFilename(filename: string): string {
  const base = (filename.split(/[/\\]/).pop() || '').trim() || 'file';
  return base.slice(0, 200);
}

export function readingOwnerDir(userId: string): string {
  const raw = (userId || '').trim();
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}
