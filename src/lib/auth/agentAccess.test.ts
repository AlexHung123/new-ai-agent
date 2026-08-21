import { describe, expect, it } from 'vitest';
import { focusModes } from '@/lib/agents';
import {
  filterFocusModesByPermissions,
  shouldAttemptTestLogin,
} from './agentAccess';

describe('shouldAttemptTestLogin', () => {
  it('redirects to test login on 401 when the URL has no token', () => {
    expect(
      shouldAttemptTestLogin({ permissionStatus: 401, tokenInUrl: false }),
    ).toBe(true);
  });

  it('does not loop when a token is already in the URL', () => {
    expect(
      shouldAttemptTestLogin({ permissionStatus: 401, tokenInUrl: true }),
    ).toBe(false);
  });

  it('does not redirect for successful or empty permission responses', () => {
    expect(
      shouldAttemptTestLogin({ permissionStatus: 200, tokenInUrl: false }),
    ).toBe(false);
    expect(
      shouldAttemptTestLogin({ permissionStatus: 500, tokenInUrl: false }),
    ).toBe(false);
  });
});

describe('filterFocusModesByPermissions', () => {
  it('keeps agents that have no permission requirement', () => {
    const modes = [
      { ...focusModes[0], permissionCode: undefined },
      focusModes[0],
    ];
    expect(filterFocusModesByPermissions(modes, []).map((m) => m.key)).toEqual([
      focusModes[0].key,
    ]);
  });

  it('keeps only agents the account is granted', () => {
    const filtered = filterFocusModesByPermissions(focusModes, [
      'chatSfcAgent:execute',
    ]);
    expect(filtered.map((mode) => mode.key)).toEqual(['agentSFC']);
  });

  it('returns no agents when the permission list is missing or empty', () => {
    expect(filterFocusModesByPermissions(focusModes, undefined)).toEqual([]);
    expect(filterFocusModesByPermissions(focusModes, [])).toEqual([]);
  });
});
