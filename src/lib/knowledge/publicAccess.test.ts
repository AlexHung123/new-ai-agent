import { describe, expect, it } from 'vitest';
import { canWritePublicLibrary, parseCuratorIds } from './publicAccess';

describe('public knowledge write access', () => {
  it('parses curator id lists', () => {
    expect(parseCuratorIds('a, b,,c')).toEqual(['a', 'b', 'c']);
    expect(parseCuratorIds(['1', ' 2 '])).toEqual(['1', '2']);
    expect(parseCuratorIds(undefined)).toEqual([]);
  });

  it('allows admins or explicit curators only', () => {
    expect(
      canWritePublicLibrary('alice', { adminUserIds: [], curatorIds: [] }),
    ).toBe(false);
    expect(
      canWritePublicLibrary('alice', {
        adminUserIds: [],
        curatorIds: ['alice'],
      }),
    ).toBe(true);
    expect(
      canWritePublicLibrary('9', { adminUserIds: ['9'], curatorIds: [] }),
    ).toBe(true);
    expect(canWritePublicLibrary('', { adminUserIds: ['9'], curatorIds: ['9'] })).toBe(
      false,
    );
  });
});
