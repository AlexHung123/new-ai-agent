export type BoundReaderInput = {
  focusMode: string;
  chatExists: boolean;
  existingDocumentId?: string | null;
  bodyDocumentId?: string | null;
};

export type BoundReaderResult =
  | { status: 'none' }
  | { status: 'ok'; fileId: string }
  | { status: 'error'; message: string };

export const READER_FOCUS_MODE = 'agentReader';
export const SELECT_PDF_MESSAGE = 'Select a PDF';

export function resolveBoundReader(input: BoundReaderInput): BoundReaderResult {
  if (input.focusMode !== READER_FOCUS_MODE) return { status: 'none' };
  if (input.chatExists) {
    const id = (input.existingDocumentId || '').trim();
    if (!id) return { status: 'error', message: SELECT_PDF_MESSAGE };
    return { status: 'ok', fileId: id };
  }
  const id = (input.bodyDocumentId || '').trim();
  if (!id) return { status: 'error', message: SELECT_PDF_MESSAGE };
  return { status: 'ok', fileId: id };
}
