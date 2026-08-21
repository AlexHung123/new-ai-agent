import { desc, eq } from 'drizzle-orm';
import db from '@/lib/db';
import { userFiles } from '@/lib/db/schema';
import { convertAttachment } from './convert';
import {
  addWritingAttachment,
  ensureWritingWorkspace,
  removeWritingAttachment,
  writeWorkspaceIndex,
  WritingAttachmentError,
} from './store';
import {
  MAX_WRITING_FILE_BYTES,
  MAX_WRITING_FILES,
  displayFilename,
  isAllowedWritingFilename,
  toPublicWritingAttachment,
  type WritingAttachment,
} from './types';

function rowToAttachment(row: typeof userFiles.$inferSelect): WritingAttachment {
  return {
    fileId: row.id,
    userId: row.userId,
    name: row.name,
    status: row.status === 'failed' ? 'failed' : 'ready',
    relDir: row.relDir || '',
    parts: row.parts ?? 0,
    charCount: row.charCount ?? 0,
    format: row.format || '',
    mimeType: row.mimeType ?? undefined,
    sizeBytes: row.sizeBytes ?? 0,
    error: row.error ?? undefined,
    createdAt: row.createdAt,
  };
}

export async function listUserWritingFiles(
  userId: string,
): Promise<WritingAttachment[]> {
  const rows = await db
    .select()
    .from(userFiles)
    .where(eq(userFiles.userId, userId))
    .orderBy(desc(userFiles.createdAt));
  return rows.map(rowToAttachment);
}

export async function ensureUserWritingWorkspace(userId: string): Promise<{
  rootAbs: string;
  files: WritingAttachment[];
}> {
  const files = await listUserWritingFiles(userId);
  const rootAbs = ensureWritingWorkspace(userId, files);
  return { rootAbs, files };
}

export async function addUserWritingFile(opts: {
  userId: string;
  filename: string;
  bytes: Uint8Array;
  mimeType?: string;
}): Promise<WritingAttachment> {
  const userId = opts.userId.trim();
  if (!userId) {
    throw new WritingAttachmentError('Missing user id', 401);
  }
  const filename = displayFilename(opts.filename);
  if (!isAllowedWritingFilename(filename)) {
    throw new WritingAttachmentError(
      'This file type is not supported. Attach documents, spreadsheets, PDFs, text, or images.',
    );
  }
  if (opts.bytes.byteLength === 0) {
    throw new WritingAttachmentError('This file is empty.');
  }
  if (opts.bytes.byteLength > MAX_WRITING_FILE_BYTES) {
    throw new WritingAttachmentError('Each file must be 15 MB or smaller.');
  }

  const existing = await listUserWritingFiles(userId);
  if (existing.length >= MAX_WRITING_FILES) {
    throw new WritingAttachmentError(
      `At most ${MAX_WRITING_FILES} files per user.`,
    );
  }

  const item = await addWritingAttachment({
    userId,
    filename,
    bytes: opts.bytes,
    mimeType: opts.mimeType,
    convert: convertAttachment,
  });

  await db.insert(userFiles).values({
    id: item.fileId,
    userId,
    name: item.name,
    mimeType: item.mimeType ?? null,
    sizeBytes: item.sizeBytes ?? opts.bytes.byteLength,
    status: item.status,
    format: item.format || null,
    relDir: item.relDir || null,
    parts: item.parts,
    charCount: item.charCount,
    error: item.error ?? null,
    createdAt: item.createdAt,
  });

  const files = await listUserWritingFiles(userId);
  writeWorkspaceIndex(userId, files);
  return item;
}

export async function removeUserWritingFile(
  userId: string,
  fileId: string,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(userFiles)
    .where(eq(userFiles.id, fileId));
  const row = rows[0];
  if (!row || row.userId !== userId) return false;

  await db.delete(userFiles).where(eq(userFiles.id, fileId));
  removeWritingAttachment(userId, fileId);
  const files = await listUserWritingFiles(userId);
  writeWorkspaceIndex(userId, files);
  return true;
}

export function publicUserWritingFiles(files: WritingAttachment[]) {
  return files.map(toPublicWritingAttachment);
}
