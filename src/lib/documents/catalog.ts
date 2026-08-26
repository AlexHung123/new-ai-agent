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
    title: 'Stores and Procurement Regulations (SPR)',
    description: '',
    dirName: 'spr',
  },
  {
    id: 'csr',
    title: 'Civil Service Regulations (CSR)',
    description: '',
    dirName: 'csr',
  },
  {
    id: 'acqn',
    title:
      'Acquisition Procedures for Listing Arrangement for Government Procurement of IT Products (GITP)',
    description: '',
    dirName: 'acqn',
  },
  {
    id: 'department-it-security',
    title: 'Departmental IT Security Policy and Guidelines (DITSP)',
    description: '',
    dirName: 'department-it-security',
  },
  {
    id: 'g3',
    title: 'IT Security Guidelines (G3)',
    description: '',
    dirName: 'g3',
  },
  {
    id: 'rm-manual',
    title: 'Records Management Manual (RMM)',
    description: '',
    dirName: 'rm-manual',
  },
  {
    id: 's17',
    title: 'Baseline IT Security Policy (S17)',
    description: '',
    dirName: 's17',
  },
  {
    id: 'sfc',
    title:
      'Finance Committee Special Meetings written replies on the Estimates of Expenditure (SFC)',
    description: '',
    dirName: 'sfc',
  },
  {
    id: 'training-guide',
    title: 'Guidelines on Training in the Civil Service (Training Guide)',
    description: '',
    dirName: 'training-guide',
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
