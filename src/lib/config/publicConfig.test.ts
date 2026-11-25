import { describe, expect, it } from 'vitest';
import { isForbiddenConfigKey, publicConfigValues } from './publicConfig';

describe('publicConfigValues', () => {
  it('omits adminUserIds without mutating the input', () => {
    const input = {
      version: 1,
      adminUserIds: ['1', '42'],
      bypassPermissionCheck: true,
      preferences: { theme: 'dark' },
      personalization: { systemInstructions: 'be brief' },
    };

    const published = publicConfigValues(input);

    expect(published).toEqual({
      version: 1,
      preferences: { theme: 'dark' },
      personalization: { systemInstructions: 'be brief' },
    });
    expect(published).not.toHaveProperty('adminUserIds');
    expect(published).not.toHaveProperty('bypassPermissionCheck');
    expect(input.adminUserIds).toEqual(['1', '42']);
    expect(input.bypassPermissionCheck).toBe(true);
    expect(published.preferences).not.toBe(input.preferences);
  });

  it('omits dochub without mutating the input', () => {
    const input = {
      version: 1,
      adminUserIds: ['1'],
      bypassPermissionCheck: false,
      dochub: { baseUrl: 'http://192.168.1.56:8787' },
      preferences: { theme: 'dark' },
      personalization: { systemInstructions: 'be brief' },
    };
    const published = publicConfigValues(input);
    expect(published).not.toHaveProperty('dochub');
    expect(input.dochub.baseUrl).toBe('http://192.168.1.56:8787');
  });

  it('omits knowledge including publicCurators without mutating the input', () => {
    const input = {
      version: 1,
      knowledge: { publicCurators: ['1', '42'] },
      preferences: { theme: 'dark' },
    };
    const published = publicConfigValues(input);
    expect(published).not.toHaveProperty('knowledge');
    expect(input.knowledge.publicCurators).toEqual(['1', '42']);
  });
});

describe('isForbiddenConfigKey', () => {
  it('blocks adminUserIds and nested paths', () => {
    expect(isForbiddenConfigKey('adminUserIds')).toBe(true);
    expect(isForbiddenConfigKey('adminUserIds.0')).toBe(true);
    expect(isForbiddenConfigKey('theme')).toBe(false);
    expect(isForbiddenConfigKey('preferences.theme')).toBe(false);
  });

  it('blocks bypassPermissionCheck and nested paths', () => {
    expect(isForbiddenConfigKey('bypassPermissionCheck')).toBe(true);
    expect(isForbiddenConfigKey('bypassPermissionCheck.enabled')).toBe(true);
  });

  it('blocks dochub and nested paths', () => {
    expect(isForbiddenConfigKey('dochub')).toBe(true);
    expect(isForbiddenConfigKey('dochub.baseUrl')).toBe(true);
  });

  it('blocks knowledge and nested paths', () => {
    expect(isForbiddenConfigKey('knowledge')).toBe(true);
    expect(isForbiddenConfigKey('knowledge.publicCurators')).toBe(true);
  });
});
