import { describe, expect, it } from 'vitest';
import { isForbiddenConfigKey, publicConfigValues } from './publicConfig';

describe('publicConfigValues', () => {
  it('omits adminUserIds without mutating the input', () => {
    const input = {
      version: 1,
      adminUserIds: ['1', '42'],
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
    expect(input.adminUserIds).toEqual(['1', '42']);
    expect(published.preferences).not.toBe(input.preferences);
  });
});

describe('isForbiddenConfigKey', () => {
  it('blocks adminUserIds and nested paths', () => {
    expect(isForbiddenConfigKey('adminUserIds')).toBe(true);
    expect(isForbiddenConfigKey('adminUserIds.0')).toBe(true);
    expect(isForbiddenConfigKey('theme')).toBe(false);
    expect(isForbiddenConfigKey('preferences.theme')).toBe(false);
  });
});
