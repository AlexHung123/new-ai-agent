import { describe, expect, it } from 'vitest';
import { fileKind, fileKindGlyph } from './fileKind';

describe('fileKind', () => {
  it('maps common writing attachments to FILES glyphs', () => {
    expect(fileKind('policy.pdf')).toBe('pdf');
    expect(fileKindGlyph('pdf')).toBe('PDF');
    expect(fileKind('notes.txt')).toBe('text');
    expect(fileKind('memo.docx')).toBe('docx');
    expect(fileKind('sheet.xlsx')).toBe('excel');
    expect(fileKind('deck.pptx')).toBe('ppt');
    expect(fileKind('photo.png')).toBe('image');
  });
});
