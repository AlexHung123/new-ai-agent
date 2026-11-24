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
  // Agent Document is now Agent Knowledge. Policy folders are pinned
  // public Knowledge folders rather than a separate document binder.
  return { status: 'none' };
}
