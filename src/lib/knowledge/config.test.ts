import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DOCHUB_BASE_URL,
  DEFAULT_DOCHUB_MAX_UPLOAD_BYTES,
  isDochubConfigured,
  resolveDochubConfig,
} from './config';

describe('resolveDochubConfig', () => {
  it('uses LAN defaults when the section is missing', () => {
    const config = resolveDochubConfig(undefined);
    expect(config.baseUrl).toBe(DEFAULT_DOCHUB_BASE_URL);
    expect(config.timeoutMs).toBe(60_000);
    expect(config.uploadTimeoutMs).toBe(120_000);
    expect(config.maxUploadBytes).toBe(DEFAULT_DOCHUB_MAX_UPLOAD_BYTES);
    expect(isDochubConfigured(config)).toBe(true);
  });

  it('strips a trailing slash on baseUrl', () => {
    const config = resolveDochubConfig({
      baseUrl: 'http://192.168.1.56:8787/',
    });
    expect(config.baseUrl).toBe('http://192.168.1.56:8787');
  });

  it('treats an empty baseUrl as unconfigured', () => {
    const config = resolveDochubConfig({ baseUrl: '   ' });
    expect(config.baseUrl).toBe('');
    expect(isDochubConfigured(config)).toBe(false);
  });
});
