import { describe, expect, it } from 'vitest';
import type { AdminChatListItem } from './adminChatList';
import {
  attachDpIds,
  capUserDpIdSql,
  toDpIdByUserId,
  uniqueNumericUserIds,
} from './capUserDpIds';

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

describe('uniqueNumericUserIds', () => {
  it('keeps unique parsed integers and drops blanks and non-numbers', () => {
    expect(uniqueNumericUserIds(['9', ' 3 ', '9', '', 'abc', '7'])).toEqual([
      9, 3, 7,
    ]);
  });
});

describe('capUserDpIdSql', () => {
  it('builds a parameterized IN query', () => {
    expect(capUserDpIdSql([9, 3])).toEqual({
      sql: 'SELECT id, dp_id FROM cap_user WHERE id IN ($1, $2)',
      params: [9, 3],
    });
  });
});

describe('toDpIdByUserId', () => {
  it('maps numeric and string ids to trimmed dp_id and skips blanks', () => {
    expect(
      toDpIdByUserId([
        { id: 9, dp_id: 'tswong' },
        { id: '3', dp_id: '  jdoe  ' },
        { id: 4, dp_id: null },
        { id: 5, dp_id: '  ' },
      ]),
    ).toEqual({
      '9': 'tswong',
      '3': 'jdoe',
    });
  });
});

describe('attachDpIds', () => {
  it('adds dpId when the user is in the map and leaves others unchanged', () => {
    const items = [
      chat({ id: '1', userId: '9' }),
      chat({ id: '2', userId: '3' }),
    ];

    expect(attachDpIds(items, { '9': 'tswong' })).toEqual([
      { ...items[0], dpId: 'tswong' },
      items[1],
    ]);
  });
});
