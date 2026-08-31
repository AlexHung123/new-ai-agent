import { isAbsolute, join, resolve } from 'node:path';
import { readingOwnerDir } from './types';

export function readingFilesRoot(): string {
  const raw = (process.env.READING_FILES_ROOT || '').trim();
  if (!raw) return resolve(process.cwd(), 'data', 'reading-attachments');
  return isAbsolute(raw) ? resolve(raw) : resolve(process.cwd(), raw);
}

export function readingOwnerRoot(userId: string): string {
  const dir = readingOwnerDir(userId);
  if (!dir) throw new Error('Missing user id for reading files');
  return join(readingFilesRoot(), dir);
}

export function readingFileDir(userId: string, fileId: string): string {
  return join(readingOwnerRoot(userId), fileId);
}

export function readingWorkspaceAbs(userId: string, fileId: string): string {
  return join(readingFileDir(userId, fileId), 'workspace');
}

export function readingOriginalAbs(userId: string, fileId: string): string {
  return join(readingFileDir(userId, fileId), 'original.pdf');
}

export function readingMarksAbs(userId: string, fileId: string): string {
  return join(readingFileDir(userId, fileId), 'marks.json');
}

export function readingManifestAbs(userId: string): string {
  return join(readingOwnerRoot(userId), 'manifest.json');
}
