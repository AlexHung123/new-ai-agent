import { describe, expect, it } from 'vitest';
import {
  allAgentPermissionCodes,
  isBypassPermissionCheckEnabled,
  resolveAgentPermissions,
} from './bypassPermissionCheck';

describe('isBypassPermissionCheckEnabled', () => {
  it('is true only for boolean true', () => {
    expect(isBypassPermissionCheckEnabled(true)).toBe(true);
    expect(isBypassPermissionCheckEnabled(false)).toBe(false);
    expect(isBypassPermissionCheckEnabled(undefined)).toBe(false);
    expect(isBypassPermissionCheckEnabled(null)).toBe(false);
    expect(isBypassPermissionCheckEnabled('true')).toBe(false);
    expect(isBypassPermissionCheckEnabled(1)).toBe(false);
  });
});

describe('allAgentPermissionCodes', () => {
  it('returns every agent permission code', () => {
    expect(allAgentPermissionCodes()).toEqual([
      'chatSfcAgent:execute',
      'chatSurveyAgent:execute',
      'chatGuideAgent:execute',
      'chatDocumentAgent:execute',
      'chatVoiceAgent:execute',
    ]);
  });
});

describe('resolveAgentPermissions', () => {
  it('returns ITMS codes when bypass is off', () => {
    expect(
      resolveAgentPermissions(['chatSfcAgent:execute'], false),
    ).toEqual(['chatSfcAgent:execute']);
  });

  it('returns every agent code and skips ITMS when bypass is on', () => {
    expect(resolveAgentPermissions([], true)).toEqual(
      allAgentPermissionCodes(),
    );
    expect(
      resolveAgentPermissions(['chatSfcAgent:execute'], true),
    ).toEqual(allAgentPermissionCodes());
  });
});
