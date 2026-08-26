export const MAX_WRITING_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_WRITING_FILES = 5;
/** Stay under AGENT_FS_MAX_READ_BYTES (200 KiB), including CJK. */
export const MAX_WRITING_PART_BYTES = 150 * 1024;

export function writingFileLimitMessage(): string {
  return `At most ${MAX_WRITING_FILES} files per user.`;
}

export function planWritingUploads<T>(
  currentCount: number,
  files: readonly T[],
): { accepted: T[]; rejected: number } {
  const used = Number.isFinite(currentCount)
    ? Math.max(0, Math.floor(currentCount))
    : 0;
  const remaining = Math.max(0, MAX_WRITING_FILES - used);
  const accepted = files.slice(0, remaining);
  return { accepted, rejected: files.length - accepted.length };
}

export function writingUnsupportedTypeMessage(): string {
  return 'This file type is not supported. Attach Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, or PDF files.';
}

const PLAIN_TEXT_EXT = new Set([
  'txt',
  'md',
  'markdown',
  'text',
  'json',
  'xml',
  'yml',
  'yaml',
  'html',
  'htm',
  'csv',
  'sh',
  'bash',
  'zsh',
  'py',
  'js',
  'ts',
  'tsx',
  'jsx',
  'sql',
  'toml',
  'ini',
  'cfg',
  'conf',
  'log',
  'csv',
  'pi',
  'r',
  'rb',
  'go',
  'rs',
  'java',
  'c',
  'h',
  'cpp',
  'css',
]);

const OFFICE_EXT = new Set([
  'doc',
  'docx',
  'docm',
  'ppt',
  'pps',
  'pot',
  'pptx',
  'pptm',
  'ppsx',
  'ppsm',
  'xls',
  'xlsx',
  'xlsm',
  'xlsb',
  'odt',
  'ods',
  'odp',
  'rtf',
  'epub',
  'csv',
  'pdf',
]);

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);

export const WRITING_ACCEPT = [...OFFICE_EXT].map((ext) => `.${ext}`).join(',');

export type WritingAttachmentStatus = 'ready' | 'failed';

export type WritingAttachment = {
  fileId: string;
  userId: string;
  name: string;
  status: WritingAttachmentStatus;
  relDir: string;
  parts: number;
  charCount: number;
  format: string;
  mimeType?: string;
  sizeBytes?: number;
  error?: string;
  createdAt: string;
};

export type WritingAttachmentView = {
  fileId: string;
  name: string;
  status: 'uploading' | WritingAttachmentStatus;
  parts?: number;
  charCount?: number;
  format?: string;
  sizeBytes?: number;
  error?: string;
};

export function toPublicWritingAttachment(
  item: WritingAttachment,
): WritingAttachmentView {
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

export function formatWritingBytes(n: number | undefined): string {
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

export function isPlainTextFilename(filename: string): boolean {
  return PLAIN_TEXT_EXT.has(fileExtension(filename));
}

export function isOfficeFilename(filename: string): boolean {
  return OFFICE_EXT.has(fileExtension(filename));
}

export function isImageFilename(filename: string): boolean {
  return IMAGE_EXT.has(fileExtension(filename));
}

export function isAllowedWritingFilename(filename: string): boolean {
  return OFFICE_EXT.has(fileExtension(filename));
}

export function filterAllowedWritingFiles<T extends { name: string }>(
  files: readonly T[],
): { accepted: T[]; rejected: number } {
  const accepted = files.filter((file) => isAllowedWritingFilename(file.name));
  return { accepted, rejected: files.length - accepted.length };
}

export function displayFilename(filename: string): string {
  const base = (filename.split(/[/\\]/).pop() || '').trim() || 'file';
  return base.slice(0, 200);
}

export function writingOwnerDir(userId: string): string {
  const raw = (userId || '').trim();
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}
