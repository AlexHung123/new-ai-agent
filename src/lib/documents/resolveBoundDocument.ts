import { SFC_DOCUMENT_FOCUS_MODE, SFC_DOCUMENT_ID } from '@/lib/agents';

export type BoundDocumentInput = {
  focusMode: string;
  chatExists: boolean;
  existingDocumentId?: string | null;
  bodyDocumentId?: string | null;
};

export type BoundDocumentResult =
  | { status: 'none' }
  | { status: 'ok'; documentId: string }
  | { status: 'error'; message: string };

export function resolveBoundDocument(
  input: BoundDocumentInput,
): BoundDocumentResult {
  if (input.focusMode === SFC_DOCUMENT_FOCUS_MODE) {
    return { status: 'ok', documentId: SFC_DOCUMENT_ID };
  }
  if (input.focusMode !== 'agentDocument') return { status: 'none' };
  if (input.chatExists) {
    const id = (input.existingDocumentId || '').trim();
    if (!id) return { status: 'error', message: 'Select a document' };
    return { status: 'ok', documentId: id };
  }
  const id = (input.bodyDocumentId || '').trim();
  if (!id) return { status: 'error', message: 'Select a document' };
  return { status: 'ok', documentId: id };
}
