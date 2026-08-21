import { describe, expect, it } from 'vitest';
import { convertAttachment, convertErrorMessage } from './convert';

describe('convertAttachment', () => {
  it('passes through utf8 text files', async () => {
    const result = await convertAttachment(
      Buffer.from('# Hello\n\nworld'),
      'notes.md',
    );
    expect(result).toEqual({
      ok: true,
      markdown: '# Hello\n\nworld',
      format: 'md',
    });
  });

  it('rejects an empty text file', async () => {
    const result = await convertAttachment(Buffer.from('   \n'), 'notes.txt');
    expect(result.ok).toBe(false);
  });

  it('stubs images as markdown without calling anydoc', async () => {
    const result = await convertAttachment(Buffer.from([0xff, 0xd8, 0xff]), 'photo.png');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe('png');
      expect(result.markdown).toMatch(/image file/i);
    }
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
