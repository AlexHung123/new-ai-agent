import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeAuthToken } from './auth';

describe('initializeAuthToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('still returns the URL token when localStorage throws', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('blocked');
      },
      getItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {},
    });

    expect(initializeAuthToken(new URLSearchParams({ token: 'abc' }))).toBe(
      'abc',
    );
  });
});
