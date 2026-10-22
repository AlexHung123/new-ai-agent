import { describe, expect, it } from 'vitest';
import { wrapHtmlPreview } from './previewDoc';

describe('wrapHtmlPreview', () => {
  it('wraps a TinyMCE body fragment in a full document', () => {
    const doc = wrapHtmlPreview('<p>Hello</p>');
    expect(doc).toMatch(/<!DOCTYPE html>/i);
    expect(doc).toContain('<p>Hello</p>');
  });

  it('allows only inline script and style in the preview document', () => {
    const doc = wrapHtmlPreview('<p>Hello</p>');
    expect(doc).toMatch(/script-src 'unsafe-inline'/);
    expect(doc).toMatch(/style-src 'unsafe-inline'/);
    expect(doc).not.toMatch(/script-src [^']*https/);
  });

  it('injects a base href so /itms/files URLs resolve on the ITMS origin', () => {
    const doc = wrapHtmlPreview(
      '<p><img src="/itms/files/a.webp"></p>',
      'https://itms.example/',
    );
    expect(doc).toContain('<base href="https://itms.example/">');
  });

  it('keeps an existing html document and inserts base into head', () => {
    const doc = wrapHtmlPreview(
      '<html><head><title>x</title></head><body><script>ok()</script></body></html>',
      'https://itms.example/',
    );
    expect(doc).toMatch(/<head[^>]*>\s*<base href="https:\/\/itms.example\/">/i);
    expect(doc).toContain('<script>ok()</script>');
  });
});
