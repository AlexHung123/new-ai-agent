import { describe, expect, it } from 'vitest';
import type { AdminChatListItem } from './adminChatList';
import {
  paginateAdminChats,
  parseAdminChatQuery,
} from './adminChatQuery';

const agentTitles = {
  agentDocument: 'Agent Document',
  agentSFC: 'Agent SFC',
};

function chat(
  partial: Partial<AdminChatListItem> & Pick<AdminChatListItem, 'id'>,
): AdminChatListItem {
  return {
    title: 'Untitled',
    userId: '1',
    focusMode: 'agentSFC',
    createdAt: 'Mon Aug 21 2026',
    ...partial,
  };
}

describe('parseAdminChatQuery', () => {
  it('defaults to empty q, page 1, pageSize 10', () => {
    expect(parseAdminChatQuery({})).toEqual({
      q: '',
      page: 1,
      pageSize: 10,
    });
  });

  it('trims q and coerces page and pageSize', () => {
    expect(
      parseAdminChatQuery({ q: '  spr  ', page: '2', pageSize: '20' }),
    ).toEqual({ q: 'spr', page: 2, pageSize: 20 });
  });

  it('rejects invalid page and caps pageSize', () => {
    expect(
      parseAdminChatQuery({ page: '0', pageSize: '-3' }),
    ).toEqual({ q: '', page: 1, pageSize: 10 });
    expect(parseAdminChatQuery({ page: 'abc', pageSize: '500' })).toEqual({
      q: '',
      page: 1,
      pageSize: 100,
    });
  });
});

describe('paginateAdminChats', () => {
  const items = [
    chat({ id: '1', title: 'How to file SPR', userId: '9', focusMode: 'agentDocument' }),
    chat({ id: '2', title: 'SFC overtime', userId: '3', focusMode: 'agentSFC' }),
    chat({ id: '3', title: 'Guide intro', userId: '9', focusMode: 'agentSFC' }),
  ];

  it('filters by title, userId, or agent title case-insensitively', () => {
    expect(
      paginateAdminChats(items, { q: 'SPR', page: 1, pageSize: 10 }, agentTitles)
        .chats.map((c) => c.id),
    ).toEqual(['1']);
    expect(
      paginateAdminChats(items, { q: '9', page: 1, pageSize: 10 }, agentTitles)
        .chats.map((c) => c.id),
    ).toEqual(['1', '3']);
    expect(
      paginateAdminChats(
        items,
        { q: 'document', page: 1, pageSize: 10 },
        agentTitles,
      ).chats.map((c) => c.id),
    ).toEqual(['1']);
  });

  it('returns a page of 10 and clamps an out-of-range page', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      chat({ id: String(i + 1), title: `Chat ${i + 1}` }),
    );

    const first = paginateAdminChats(
      many,
      { q: '', page: 1, pageSize: 10 },
      agentTitles,
    );
    expect(first.total).toBe(25);
    expect(first.pageCount).toBe(3);
    expect(first.chats).toHaveLength(10);
    expect(first.chats[0].id).toBe('1');
    expect(first.chats[9].id).toBe('10');

    const last = paginateAdminChats(
      many,
      { q: '', page: 9, pageSize: 10 },
      agentTitles,
    );
    expect(last.page).toBe(3);
    expect(last.chats.map((c) => c.id)).toEqual([
      '21',
      '22',
      '23',
      '24',
      '25',
    ]);
  });

  it('returns an empty page when nothing matches', () => {
    const result = paginateAdminChats(
      items,
      { q: 'no-such-chat', page: 1, pageSize: 10 },
      agentTitles,
    );
    expect(result).toEqual({
      chats: [],
      total: 0,
      page: 1,
      pageSize: 10,
      pageCount: 1,
    });
  });
});
