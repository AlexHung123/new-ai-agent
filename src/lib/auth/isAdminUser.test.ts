import { describe, expect, it } from 'vitest';
import {
  isAdminUserId,
  normalizeAdminUserIds,
  requireAdmin,
} from './isAdminUser';

describe('normalizeAdminUserIds', () => {
  it('returns empty for missing, null, and non-arrays', () => {
    expect(normalizeAdminUserIds(undefined)).toEqual([]);
    expect(normalizeAdminUserIds(null)).toEqual([]);
    expect(normalizeAdminUserIds({ '0': '1' })).toEqual([]);
  });

  it('coerces entries to trimmed strings and drops blanks', () => {
    expect(normalizeAdminUserIds([1, '42', ' 7 ', '', '  '])).toEqual([
      '1',
      '42',
      '7',
    ]);
  });
});

describe('isAdminUserId', () => {
  const admins = ['1', '42'];

  it('matches string or numeric userId against the list', () => {
    expect(isAdminUserId('1', admins)).toBe(true);
    expect(isAdminUserId(42, admins)).toBe(true);
    expect(isAdminUserId('99', admins)).toBe(false);
  });

  it('returns false for blank userId', () => {
    expect(isAdminUserId(null, admins)).toBe(false);
    expect(isAdminUserId(undefined, admins)).toBe(false);
    expect(isAdminUserId('', admins)).toBe(false);
    expect(isAdminUserId('  ', admins)).toBe(false);
  });
});

describe('requireAdmin', () => {
  const admins = ['1'];

  it('returns 401 when userId is missing', async () => {
    const denied = requireAdmin(null, admins);
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(401);
    await expect(denied!.json()).resolves.toEqual({
      message: 'Unauthorized - Authentication required',
    });
  });

  it('returns 403 without listing admin ids when the user is not admin', async () => {
    const denied = requireAdmin('99', admins);
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(403);
    const body = await denied!.json();
    expect(body).toEqual({ message: 'Forbidden' });
    expect(JSON.stringify(body)).not.toContain('adminUserIds');
    expect(JSON.stringify(body)).not.toContain('1');
  });

  it('returns null for an admin userId', () => {
    expect(requireAdmin('1', admins)).toBeNull();
  });
});
