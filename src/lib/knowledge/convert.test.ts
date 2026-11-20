import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE,
  convertKnowledgeAttachment,
} from './convert';

describe('convertKnowledgeAttachment', () => {
  it('accepts markdown and text as utf-8', async () => {
    const md = await convertKnowledgeAttachment(
      Buffer.from('# Hello\n\nworld'),
      'notes.md',
    );
    expect(md.ok).toBe(true);
    if (md.ok) {
      expect(md.markdown).toContain('# Hello');
      expect(md.format).toBe('md');
    }

    const txt = await convertKnowledgeAttachment(
      Buffer.from('hello'),
      'notes.txt',
    );
    expect(txt.ok).toBe(true);
    if (txt.ok) expect(txt.markdown).toBe('hello');
  });

  it('strips a utf-8 BOM from markdown', async () => {
    const result = await convertKnowledgeAttachment(
      Buffer.from([0xef, 0xbb, 0xbf, 0x23, 0x20, 0x48]),
      'notes.md',
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.markdown.startsWith('# H')).toBe(true);
  });

  it('rejects empty text', async () => {
    const result = await convertKnowledgeAttachment(
      Buffer.from('   \n'),
      'notes.md',
    );
    expect(result.ok).toBe(false);
  });

  it('rejects zip and images with the knowledge type message', async () => {
    const zip = await convertKnowledgeAttachment(Buffer.from('x'), 'pack.zip');
    expect(zip.ok).toBe(false);
    if (!zip.ok) expect(zip.error).toBe(KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE);

    const png = await convertKnowledgeAttachment(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      'photo.png',
    );
    expect(png.ok).toBe(false);
  });

  it('rejects files over maxBytes', async () => {
    const result = await convertKnowledgeAttachment(
      Buffer.from('hello world'),
      'notes.md',
      { maxBytes: 4 },
    );
    expect(result.ok).toBe(false);
  });

  it('converts a small csv through convertAttachment', async () => {
    const result = await convertKnowledgeAttachment(
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
