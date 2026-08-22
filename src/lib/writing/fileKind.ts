import { fileExtension } from './types';

export type FileKind =
  | 'pdf'
  | 'image'
  | 'text'
  | 'html'
  | 'excel'
  | 'ppt'
  | 'docx'
  | 'other';

export function fileKind(name: string): FileKind {
  const ext = fileExtension(name);
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (['html', 'htm'].includes(ext)) return 'html';
  if (['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'].includes(ext)) return 'excel';
  if (['pptx', 'ppt', 'pptm', 'pps', 'ppsx', 'odp'].includes(ext)) return 'ppt';
  if (['docx', 'doc', 'docm', 'odt', 'rtf'].includes(ext)) return 'docx';
  if (
    [
      'txt',
      'md',
      'markdown',
      'csv',
      'json',
      'log',
      'xml',
      'yml',
      'yaml',
    ].includes(ext)
  ) {
    return 'text';
  }
  return 'other';
}

export function fileKindGlyph(kind: FileKind): string {
  switch (kind) {
    case 'pdf':
      return 'PDF';
    case 'image':
      return 'IMG';
    case 'excel':
      return 'XLS';
    case 'ppt':
      return 'PPT';
    case 'docx':
      return 'DOC';
    case 'html':
      return 'HTML';
    case 'text':
      return 'TXT';
    default:
      return 'FILE';
  }
}
