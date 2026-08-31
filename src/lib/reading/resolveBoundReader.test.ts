import { describe, expect, it } from 'vitest';
import { resolveBoundReader } from './resolveBoundReader';

describe('resolveBoundReader', () => {
  it('returns none for other focus modes', () => {
    expect(
      resolveBoundReader({
        focusMode: 'agentDocument',
        chatExists: false,
        bodyDocumentId: 'abc',
      }),
    ).toEqual({ status: 'none' });
  });

  it('requires a file id when creating a reader chat', () => {
    expect(
      resolveBoundReader({
        focusMode: 'agentReader',
        chatExists: false,
        bodyDocumentId: undefined,
      }),
    ).toEqual({ status: 'error', message: 'Select a PDF' });
  });

  it('uses the row file id for an existing chat', () => {
    expect(
      resolveBoundReader({
        focusMode: 'agentReader',
        chatExists: true,
        existingDocumentId: 'file-a',
        bodyDocumentId: 'file-b',
      }),
    ).toEqual({ status: 'ok', fileId: 'file-a' });
  });

  it('binds body file id on create', () => {
    expect(
      resolveBoundReader({
        focusMode: 'agentReader',
        chatExists: false,
        bodyDocumentId: 'file-a',
      }),
    ).toEqual({ status: 'ok', fileId: 'file-a' });
  });
});
