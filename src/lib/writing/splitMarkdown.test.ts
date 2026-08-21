import { describe, expect, it } from 'vitest';
import { splitMarkdownParts, utf8ByteLength } from './splitMarkdown';

describe('splitMarkdownParts', () => {
  it('keeps a short document as one part', () => {
    expect(splitMarkdownParts('# Title\n\nHello', 1000)).toEqual([
      '# Title\n\nHello',
    ]);
  });

  it('splits on headings before exceeding the byte cap', () => {
    const md = '# A\n\n' + 'aaaa\n\n' + '# B\n\n' + 'bbbb';
    const parts = splitMarkdownParts(md, 12);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join('\n\n')).toContain('# A');
    expect(parts.join('\n\n')).toContain('# B');
    for (const part of parts) {
      expect(utf8ByteLength(part)).toBeLessThanOrEqual(12);
    }
  });

  it('counts CJK by utf8 bytes not characters', () => {
    const md = '你好'.repeat(50);
    const parts = splitMarkdownParts(md, 30);
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      expect(utf8ByteLength(part)).toBeLessThanOrEqual(30);
    }
  });
});
