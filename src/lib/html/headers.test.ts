import { describe, expect, it } from 'vitest';
import { htmlPageResponseHeaders } from './headers';

describe('htmlPageResponseHeaders', () => {
  it('serves HTML with a tight CSP and no framing from other sites', () => {
    const headers = htmlPageResponseHeaders();
    expect(headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Content-Security-Policy']).toMatch(/default-src 'none'/);
    expect(headers['Content-Security-Policy']).toMatch(/script-src 'unsafe-inline'/);
    expect(headers['Content-Security-Policy']).toMatch(/style-src 'unsafe-inline'/);
    expect(headers['Content-Security-Policy']).toMatch(/frame-ancestors 'self'/);
  });
});
