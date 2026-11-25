import { describe, expect, it } from 'vitest';
import { fileKind, fileKindGlyph, usesNativeDocumentPreview } from './fileKind';

describe('fileKind', () => {
  it('maps common writing attachments to FILES glyphs', () => {
    expect(fileKind('policy.pdf')).toBe('pdf');
    expect(fileKindGlyph('pdf')).toBe('PDF');
    expect(fileKind('notes.txt')).toBe('text');
    expect(fileKind('memo.docx')).toBe('docx');
    expect(fileKind('sheet.xlsx')).toBe('excel');
    expect(fileKind('deck.pptx')).toBe('ppt');
    expect(fileKind('photo.png')).toBe('image');
    expect(fileKind('chapter.qmd')).toBe('text');
  });

  it('sends office, pdf, csv, and images to the native viewer', () => {
    expect(usesNativeDocumentPreview('policy.pdf')).toBe(true);
    expect(usesNativeDocumentPreview('memo.docx')).toBe(true);
    expect(usesNativeDocumentPreview('legacy.doc')).toBe(true);
    expect(usesNativeDocumentPreview('sheet.xlsx')).toBe(true);
    expect(usesNativeDocumentPreview('export.csv')).toBe(true);
    expect(usesNativeDocumentPreview('deck.pptx')).toBe(true);
    expect(usesNativeDocumentPreview('photo.png')).toBe(true);
    expect(usesNativeDocumentPreview('notes.md')).toBe(false);
    expect(usesNativeDocumentPreview('chapter.qmd')).toBe(false);
    expect(usesNativeDocumentPreview('readme.txt')).toBe(false);
  });
});
