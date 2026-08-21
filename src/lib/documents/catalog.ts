import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

export type DocumentSlot = {
  id: string;
  title: string;
  description: string;
  dirName: string;
};

export const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    id: 'spr',
    title: 'SPR',
    description: 'Stores and Procurement Regulations (物料供應及採購規例)',
    dirName: 'spr',
  },
  {
    id: 'csr',
    title: 'CSR',
    description: 'Civil Service Regulations (公務員事務規例)',
    dirName: 'csr',
  },
];

export function documentsRoot(): string {
  const raw = (process.env.DOCUMENT_FILES_ROOT || '').trim();
  if (!raw) return resolve(process.cwd(), 'data', 'documents');
  return isAbsolute(raw) ? resolve(raw) : resolve(process.cwd(), raw);
}

export function documentRootAbs(slot: DocumentSlot): string {
  return join(documentsRoot(), slot.dirName);
}

export function isDocumentAvailable(slot: DocumentSlot): boolean {
  const abs = documentRootAbs(slot);
  if (!existsSync(abs)) return false;
  try {
    if (!statSync(abs).isDirectory()) return false;
  } catch {
    return false;
  }
  return existsSync(join(abs, 'AGENTS.md')) || existsSync(join(abs, 'wiki'));
}

export function listAvailableDocuments(): DocumentSlot[] {
  return DOCUMENT_SLOTS.filter(isDocumentAvailable);
}

export function resolveDocument(
  id: string | null | undefined,
): DocumentSlot | null {
  const key = (id || '').trim();
  if (!key) return null;
  const slot = DOCUMENT_SLOTS.find((s) => s.id === key);
  if (!slot || !isDocumentAvailable(slot)) return null;
  return slot;
}

export function toPublicDocumentItem(slot: DocumentSlot) {
  return {
    id: slot.id,
    title: slot.title,
    description: slot.description,
  };
}
