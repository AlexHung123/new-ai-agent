import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { convertAttachment } from '@/lib/writing/convert';
import { splitMarkdownParts } from '@/lib/writing/splitMarkdown';
import { MAX_WRITING_PART_BYTES } from '@/lib/writing/types';
import {
  readingFileDir,
  readingManifestAbs,
  readingMarksAbs,
  readingOriginalAbs,
  readingOwnerRoot,
  readingWorkspaceAbs,
} from './paths';
import {
  MAX_READING_FILE_BYTES,
  MAX_READING_FILES,
  displayFilename,
  isPdfFilename,
  readingFileLimitMessage,
  readingUnsupportedTypeMessage,
  type ReaderMark,
  type ReadingAttachment,
} from './types';

export class ReadingAttachmentError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'ReadingAttachmentError';
  }
}

type Manifest = {
  files: ReadingAttachment[];
};

function readManifest(userId: string): Manifest {
  const abs = readingManifestAbs(userId);
  if (!existsSync(abs)) return { files: [] };
  try {
    const parsed = JSON.parse(readFileSync(abs, 'utf8')) as Manifest;
    if (!Array.isArray(parsed?.files)) return { files: [] };
    return {
      files: parsed.files.filter((f) => f && typeof f.fileId === 'string'),
    };
  } catch {
    return { files: [] };
  }
}

function writeManifest(userId: string, manifest: Manifest) {
  const abs = readingManifestAbs(userId);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(manifest, null, 2), 'utf8');
}

function partName(index: number, total: number): string {
  const width = total >= 100 ? 3 : 2;
  return `part-${String(index).padStart(width, '0')}.md`;
}

function writeWorkspaceIndex(item: ReadingAttachment, partFiles: string[]) {
  const dir = readingWorkspaceAbs(item.userId, item.fileId);
  mkdirSync(dir, { recursive: true });
  const lines = [
    `# ${item.name}`,
    '',
    `- Original name: ${item.name}`,
    `- Format: pdf`,
    `- Characters: ${item.charCount}`,
    `- Parts: ${item.parts}`,
    '',
    'This folder is the extracted text of one PDF.',
    'Prefer fs_grep to locate a section, then fs_read around the hit (path:fromLine:maxLines).',
    'Do not invent wording that is not in these files.',
    '',
  ];
  for (const name of partFiles) {
    lines.push(`- ${name}`);
  }
  lines.push('');
  writeFileSync(join(dir, 'INDEX.md'), lines.join('\n'), 'utf8');
}

function writeFailedIndex(item: ReadingAttachment) {
  const dir = readingWorkspaceAbs(item.userId, item.fileId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'INDEX.md'),
    `# ${item.name}\n\nText extraction failed.\n${item.error || ''}\n`,
    'utf8',
  );
}

export function listReadingAttachments(userId: string): ReadingAttachment[] {
  return readManifest(userId).files;
}

export function getReadingAttachment(
  userId: string,
  fileId: string,
): ReadingAttachment | null {
  const id = (fileId || '').trim();
  if (!id) return null;
  return listReadingAttachments(userId).find((file) => file.fileId === id) ?? null;
}

export async function addReadingAttachment(opts: {
  userId: string;
  filename: string;
  bytes: Uint8Array;
  mimeType?: string;
  fileId?: string;
  convert?: typeof convertAttachment;
}): Promise<ReadingAttachment> {
  const userId = opts.userId.trim();
  if (!userId) {
    throw new ReadingAttachmentError('Missing user id', 401);
  }
  const filename = displayFilename(opts.filename);
  if (!isPdfFilename(filename)) {
    throw new ReadingAttachmentError(readingUnsupportedTypeMessage());
  }
  if (opts.bytes.byteLength === 0) {
    throw new ReadingAttachmentError('This file is empty.');
  }
  if (opts.bytes.byteLength > MAX_READING_FILE_BYTES) {
    throw new ReadingAttachmentError('Each file must be 15 MB or smaller.');
  }

  const existing = listReadingAttachments(userId);
  if (existing.length >= MAX_READING_FILES) {
    throw new ReadingAttachmentError(readingFileLimitMessage());
  }

  const fileId = (opts.fileId || randomBytes(8).toString('hex')).replace(
    /[^a-f0-9]/gi,
    '',
  );
  const convert = opts.convert ?? convertAttachment;
  const converted = await convert(opts.bytes, filename);

  const item: ReadingAttachment = {
    fileId,
    userId,
    name: filename,
    status: converted.ok ? 'ready' : 'failed',
    relDir: fileId,
    parts: 0,
    charCount: converted.ok ? converted.markdown.length : 0,
    format: converted.ok ? converted.format : 'pdf',
    mimeType: opts.mimeType || 'application/pdf',
    sizeBytes: opts.bytes.byteLength,
    error: converted.ok ? undefined : converted.error,
    createdAt: new Date().toISOString(),
  };

  mkdirSync(readingFileDir(userId, fileId), { recursive: true });
  writeFileSync(readingOriginalAbs(userId, fileId), Buffer.from(opts.bytes));

  if (converted.ok) {
    const parts = splitMarkdownParts(converted.markdown, MAX_WRITING_PART_BYTES);
    item.parts = Math.max(1, parts.length);
    const dir = readingWorkspaceAbs(userId, fileId);
    mkdirSync(dir, { recursive: true });
    const partFiles: string[] = [];
    parts.forEach((body, i) => {
      const name = partName(i + 1, parts.length);
      partFiles.push(name);
      const header = `<!-- ${filename} part ${i + 1}/${parts.length} -->\n\n`;
      writeFileSync(join(dir, name), header + body, 'utf8');
    });
    writeWorkspaceIndex(item, partFiles);
  } else {
    writeFailedIndex(item);
  }

  writeMarksFile(userId, fileId, []);
  writeManifest(userId, {
    files: [...existing.filter((f) => f.fileId !== fileId), item],
  });
  return item;
}

export function removeReadingAttachment(userId: string, fileId: string): boolean {
  const manifest = readManifest(userId);
  const item = manifest.files.find((f) => f.fileId === fileId);
  if (!item) return false;
  rmSync(readingFileDir(userId, fileId), { recursive: true, force: true });
  writeManifest(userId, {
    files: manifest.files.filter((f) => f.fileId !== fileId),
  });
  return true;
}

export function removeReadingOwnerDir(userId: string) {
  const root = readingOwnerRoot(userId);
  if (!existsSync(root)) return;
  rmSync(root, { recursive: true, force: true });
}

function isReaderMark(value: unknown): value is ReaderMark {
  if (!value || typeof value !== 'object') return false;
  const mark = value as ReaderMark;
  return (
    typeof mark.id === 'string' &&
    (mark.kind === 'highlight' || mark.kind === 'ask') &&
    typeof mark.page === 'number' &&
    Number.isFinite(mark.page) &&
    typeof mark.quote === 'string' &&
    typeof mark.createdAt === 'string'
  );
}

export function readMarks(userId: string, fileId: string): ReaderMark[] {
  const abs = readingMarksAbs(userId, fileId);
  if (!existsSync(abs)) return [];
  try {
    const parsed = JSON.parse(readFileSync(abs, 'utf8')) as { items?: unknown };
    if (!Array.isArray(parsed?.items)) return [];
    return parsed.items.filter(isReaderMark);
  } catch {
    return [];
  }
}

function writeMarksFile(userId: string, fileId: string, items: ReaderMark[]) {
  const abs = readingMarksAbs(userId, fileId);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify({ items }, null, 2), 'utf8');
}

export function addReaderMark(
  userId: string,
  fileId: string,
  mark: Omit<ReaderMark, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
  },
): ReaderMark {
  if (!getReadingAttachment(userId, fileId)) {
    throw new ReadingAttachmentError('File not found', 404);
  }
  const quote = (mark.quote || '').trim();
  if (!quote) {
    throw new ReadingAttachmentError('Quote is required');
  }
  const page = Math.max(1, Math.floor(mark.page || 1));
  const item: ReaderMark = {
    id: mark.id || randomBytes(6).toString('hex'),
    kind: mark.kind,
    page,
    quote,
    question: mark.question?.trim() || undefined,
    createdAt: mark.createdAt || new Date().toISOString(),
  };
  const items = [...readMarks(userId, fileId), item];
  writeMarksFile(userId, fileId, items);
  return item;
}

export function removeReaderMark(
  userId: string,
  fileId: string,
  markId: string,
): boolean {
  if (!getReadingAttachment(userId, fileId)) return false;
  const items = readMarks(userId, fileId);
  const next = items.filter((mark) => mark.id !== markId);
  if (next.length === items.length) return false;
  writeMarksFile(userId, fileId, next);
  return true;
}
