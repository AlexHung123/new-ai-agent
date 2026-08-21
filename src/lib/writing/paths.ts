import { isAbsolute, join, resolve } from 'node:path';
import { displayFilename, fileExtension, writingOwnerDir } from './types';

export function writingFilesRoot(): string {
  const raw = (process.env.WRITING_FILES_ROOT || '').trim();
  if (!raw) return resolve(process.cwd(), 'data', 'writing-attachments');
  return isAbsolute(raw) ? resolve(raw) : resolve(process.cwd(), raw);
}

export function writingOwnerRoot(userId: string): string {
  const dir = writingOwnerDir(userId);
  if (!dir) throw new Error('Missing user id for writing files');
  return join(writingFilesRoot(), dir);
}

export function writingWorkspaceAbs(userId: string): string {
  return join(writingOwnerRoot(userId), 'workspace');
}

export function writingRawAbs(
  userId: string,
  fileId: string,
  filename: string,
): string {
  const ext = fileExtension(filename);
  const safeExt = ext && /^[a-z0-9]{1,10}$/.test(ext) ? `.${ext}` : '';
  return join(writingOwnerRoot(userId), 'raw', `${fileId}${safeExt}`);
}

export function writingManifestAbs(userId: string): string {
  return join(writingOwnerRoot(userId), 'manifest.json');
}

export function attachmentSlug(filename: string, fileId: string): string {
  const base = displayFilename(filename).replace(/\.[^.]+$/, '');
  const slug = base
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const id = fileId.replace(/[^a-f0-9]/gi, '').slice(0, 8) || 'file';
  return `${slug || 'file'}-${id}`;
}
