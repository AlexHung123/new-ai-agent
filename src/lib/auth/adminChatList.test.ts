import { describe, expect, it } from 'vitest';
import { toAdminChatListItem } from './adminChatList';

describe('toAdminChatListItem', () => {
  it('keeps list metadata and drops files and documentId', () => {
    const item = toAdminChatListItem({
      id: 'chat-1',
      title: 'How to file SPR',
      userId: '9',
      focusMode: 'agentDocument',
      createdAt: 'Mon Aug 21 2026',
      documentId: 'spr',
      files: [{ name: 'secret.pdf', fileId: 'f1' }],
    });

    expect(item).toEqual({
      id: 'chat-1',
      title: 'How to file SPR',
      userId: '9',
      focusMode: 'agentDocument',
      createdAt: 'Mon Aug 21 2026',
    });
    expect(item).not.toHaveProperty('files');
    expect(item).not.toHaveProperty('documentId');
  });
});
