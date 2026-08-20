import { describe, expect, it } from 'vitest';
import { resolveBoundDocument } from './resolveBoundDocument';

describe('resolveBoundDocument', () => {
  it('returns none for non-document focus modes', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentGuide',
      existingDocumentId: null,
      bodyDocumentId: 'spr',
      chatExists: false,
    });
    expect(r).toEqual({ status: 'none' });
  });

  it('requires body documentId when creating a document chat', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentDocument',
      existingDocumentId: null,
      bodyDocumentId: undefined,
      chatExists: false,
    });
    expect(r).toEqual({ status: 'error', message: 'Select a document' });
  });

  it('uses the row documentId for an existing chat and ignores the body', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentDocument',
      existingDocumentId: 'spr',
      bodyDocumentId: 'csr',
      chatExists: true,
    });
    expect(r).toEqual({ status: 'ok', documentId: 'spr' });
  });

  it('errors when an existing document chat has no documentId', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentDocument',
      existingDocumentId: null,
      bodyDocumentId: 'spr',
      chatExists: true,
    });
    expect(r).toEqual({
      status: 'error',
      message: 'Select a document',
    });
  });
});
