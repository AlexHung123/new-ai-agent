import { describe, expect, it } from 'vitest';
import { convertAttachment, convertErrorMessage } from './convert';

describe('convertAttachment', () => {
  it('rejects markdown, text, and images as unsupported upload types', async () => {
    const md = await convertAttachment(Buffer.from('# Hello\n\nworld'), 'notes.md');
    expect(md.ok).toBe(false);
    if (!md.ok) {
      expect(md.error).toMatch(/Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, or PDF/i);
    }

    const txt = await convertAttachment(Buffer.from('hello'), 'notes.txt');
    expect(txt.ok).toBe(false);

    const png = await convertAttachment(
      Buffer.from([0xff, 0xd8, 0xff]),
      'photo.png',
    );
    expect(png.ok).toBe(false);
  });

  it('rejects archives before calling anydoc', async () => {
    const result = await convertAttachment(Buffer.from('x'), 'pack.zip');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not supported/i);
  });

  it('maps anydoc error codes to user messages', () => {
    expect(convertErrorMessage('encrypted')).toMatch(/password/i);
    expect(convertErrorMessage('unsupported')).toMatch(/scanned/i);
  });
});

describe('anydoc native convert', () => {
  it('converts a small csv', async () => {
    const result = await convertAttachment(
      Buffer.from('name,qty\nwidget,2\n'),
      'items.csv',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe('csv');
      expect(result.markdown.toLowerCase()).toMatch(/widget/);
    }
  });
});
