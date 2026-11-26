import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { DOCUMENT_SLOTS, type DocumentSlot } from './slots';

export type { DocumentSlot } from './slots';
export { DOCUMENT_SLOTS } from './slots';

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
  return DOCUMENT_SLOTS.filter(
    (slot) => !slot.hiddenFromPicker && isDocumentAvailable(slot),
  );
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
