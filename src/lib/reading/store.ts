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
  ensurePageMarker,
  extractPdfPages,
  formatPageMarkdown,
  type PdfExtractOk,
  type PdfExtractResult,
} from './extractPdfPages';
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

function pageFileName(
  page: number,
  pageCount: number,
  part?: number,
  partCount?: number,
): string {
  const width = pageCount >= 100 ? 3 : 2;
  const base = `page-${String(page).padStart(width, '0')}`;
  if (!partCount || partCount <= 1) return `${base}.md`;
  return `${base}-${String(part).padStart(2, '0')}.md`;
}

function unpagedPartName(index: number, total: number): string {
  const width = total >= 100 ? 3 : 2;
  return `part-${String(index).padStart(width, '0')}.md`;
}

function writeWorkspaceIndex(
  item: ReadingAttachment,
  files: Array<{ name: string; label: string }>,
  paged: boolean,
) {
  const dir = readingWorkspaceAbs(item.userId, item.fileId);
  mkdirSync(dir, { recursive: true });
  const lines = [
    `# ${item.name}`,
    '',
    `- Original name: ${item.name}`,
    `- Format: pdf`,
    `- Characters: ${item.charCount}`,
    `- Files: ${item.parts}`,
    paged
      ? '- Page markers: each file starts with `<!-- page: N -->`. Cite hits as `p. N` matching that marker. Do not invent page numbers.'
      : '- Page markers were not extracted. Do not invent page numbers unless the user quoted a page.',
    '',
    'This folder is the extracted text of one PDF.',
    'Prefer fs_grep to locate a section, then fs_read around the hit (path:fromLine:maxLines).',
    'Do not invent wording that is not in these files.',
    '',
    '## Files',
    '',
  ];
  for (const file of files) {
    lines.push(`- \`${file.name}\` — ${file.label}`);
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

async function resolveExtractedPdf(opts: {
  bytes: Uint8Array;
  filename: string;
  convert: typeof convertAttachment;
  extractPages?: (bytes: Uint8Array) => Promise<PdfExtractResult>;
}): Promise<PdfExtractResult> {
  const extract = opts.extractPages ?? extractPdfPages;
  const paged = await extract(opts.bytes);
  if (paged.ok) return paged;
  const converted = await opts.convert(opts.bytes, opts.filename);
  if (converted.ok) {
    return {
      ok: true,
      paged: false,
      pageCount: 1,
      pages: [{ page: 1, text: converted.markdown }],
    };
  }
  return { ok: false, error: converted.error || paged.error };
}

function writeExtractedFiles(
  item: ReadingAttachment,
  extracted: PdfExtractOk,
): { parts: number; charCount: number } {
  const dir = readingWorkspaceAbs(item.userId, item.fileId);
  mkdirSync(dir, { recursive: true });
  const files: Array<{ name: string; label: string }> = [];
  let charCount = 0;
  let parts = 0;

  if (extracted.paged) {
    for (const page of extracted.pages) {
      const markdown = formatPageMarkdown(page.page, page.text);
      charCount += page.text.length;
      const chunks = splitMarkdownParts(markdown, MAX_WRITING_PART_BYTES);
      const partCount = Math.max(1, chunks.length);
      chunks.forEach((chunk, i) => {
        const name = pageFileName(
          page.page,
          extracted.pageCount,
          i + 1,
          partCount,
        );
        writeFileSync(
          join(dir, name),
          ensurePageMarker(chunk, page.page),
          'utf8',
        );
        files.push({
          name,
          label:
            partCount > 1
              ? `page ${page.page} (part ${i + 1}/${partCount})`
              : `page ${page.page}`,
        });
        parts += 1;
      });
    }
  } else {
    const markdown = extracted.pages[0]?.text || '';
    charCount = markdown.length;
    const chunks = splitMarkdownParts(markdown, MAX_WRITING_PART_BYTES);
    const partCount = Math.max(1, chunks.length);
    chunks.forEach((chunk, i) => {
      const name = unpagedPartName(i + 1, partCount);
      writeFileSync(join(dir, name), chunk, 'utf8');
      files.push({
        name,
        label: partCount > 1 ? `part ${i + 1}/${partCount}` : 'extracted text',
      });
      parts += 1;
    });
  }

  item.parts = parts;
  item.charCount = charCount;
  writeWorkspaceIndex(item, files, extracted.paged);
  return { parts, charCount };
}

export async function addReadingAttachment(opts: {
  userId: string;
  filename: string;
  bytes: Uint8Array;
  mimeType?: string;
  fileId?: string;
  convert?: typeof convertAttachment;
  extractPages?: (bytes: Uint8Array) => Promise<PdfExtractResult>;
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
  const extracted = await resolveExtractedPdf({
    bytes: opts.bytes,
    filename,
    convert,
    extractPages: opts.extractPages,
  });

  const item: ReadingAttachment = {
    fileId,
    userId,
    name: filename,
    status: extracted.ok ? 'ready' : 'failed',
    relDir: fileId,
    parts: 0,
    charCount: extracted.ok
      ? extracted.pages.reduce((sum, page) => sum + page.text.length, 0)
      : 0,
    format: 'pdf',
    mimeType: opts.mimeType || 'application/pdf',
    sizeBytes: opts.bytes.byteLength,
    error: extracted.ok ? undefined : extracted.error,
    createdAt: new Date().toISOString(),
  };

  mkdirSync(readingFileDir(userId, fileId), { recursive: true });
  writeFileSync(readingOriginalAbs(userId, fileId), Buffer.from(opts.bytes));

  if (extracted.ok) {
    writeExtractedFiles(item, extracted);
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
