import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_USER_BYTES,
  formatStorageBytes,
  quotaExceededMessage,
  quotaForLibrary,
  quotaForUser,
  storageUsage,
  storedUploadBytes,
  wouldExceedQuota,
} from './storage';

describe('formatStorageBytes', () => {
  it('formats bytes through gigabytes like pi-rag', () => {
    expect(formatStorageBytes(0)).toBe('0 B');
    expect(formatStorageBytes(378.5 * 1024)).toBe('378.5 KB');
    expect(formatStorageBytes(DEFAULT_MAX_USER_BYTES)).toBe('5.00 GB');
  });
});

describe('quotaForUser', () => {
  it('uses the default cap and per-user overrides', () => {
    expect(quotaForUser('1', DEFAULT_MAX_USER_BYTES, {})).toBe(
      DEFAULT_MAX_USER_BYTES,
    );
    expect(
      quotaForUser('1', DEFAULT_MAX_USER_BYTES, { '1': 10 * 1024 * 1024 }),
    ).toBe(10 * 1024 * 1024);
  });
});

describe('quotaForLibrary', () => {
  it('uses the shared max for public and the per-user cap for private', () => {
    expect(
      quotaForLibrary('public', '1', DEFAULT_MAX_USER_BYTES, {
        '1': 10 * 1024 * 1024,
      }),
    ).toBe(DEFAULT_MAX_USER_BYTES);
    expect(
      quotaForLibrary('private', '1', DEFAULT_MAX_USER_BYTES, {
        '1': 10 * 1024 * 1024,
      }),
    ).toBe(10 * 1024 * 1024);
  });
});

describe('storedUploadBytes', () => {
  it('counts original bytes plus the converted markdown', () => {
    expect(storedUploadBytes(8, '# Hello\n')).toBe(8 + Buffer.byteLength('# Hello\n', 'utf8'));
    expect(storedUploadBytes(100, '')).toBe(100);
  });
});

describe('storageUsage', () => {
  it('computes remaining bytes and ratio', () => {
    const usage = storageUsage(200, 1000);
    expect(usage).toEqual({
      usedBytes: 200,
      quotaBytes: 1000,
      remainingBytes: 800,
      usageRatio: 0.2,
    });
  });

  it('rejects an upload that would pass the cap', () => {
    const usage = storageUsage(900, 1000);
    expect(wouldExceedQuota(usage, 200)).toBe(true);
    expect(wouldExceedQuota(usage, 50)).toBe(false);
    expect(quotaExceededMessage(usage, 200)).toMatch(/Storage quota exceeded/);
    expect(quotaExceededMessage(usage, 200)).toMatch(/900 B \/ 1000 B/);
  });
});
