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

  it('always binds Agent SFC Document Q&A to the sfc catalog slot', () => {
    expect(
      resolveBoundDocument({
        focusMode: 'sfcDocumentAgent',
        existingDocumentId: 'spr',
        bodyDocumentId: 'csr',
        chatExists: true,
      }),
    ).toEqual({ status: 'ok', documentId: 'sfc' });
    expect(
      resolveBoundDocument({
        focusMode: 'sfcDocumentAgent',
        existingDocumentId: null,
        bodyDocumentId: undefined,
        chatExists: false,
      }),
    ).toEqual({ status: 'ok', documentId: 'sfc' });
  });

  it('does not bind Agent Document chats; those now pin a public Knowledge folder', () => {
    expect(
      resolveBoundDocument({
        focusMode: 'agentDocument',
        existingDocumentId: 'spr',
        bodyDocumentId: 'csr',
        chatExists: true,
      }),
    ).toEqual({ status: 'none' });
    expect(
      resolveBoundDocument({
        focusMode: 'agentKnowledge',
        existingDocumentId: null,
        bodyDocumentId: 'spr',
        chatExists: false,
      }),
    ).toEqual({ status: 'none' });
  });
});
