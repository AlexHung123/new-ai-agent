import {
  fileExtension,
  isOfficeFilename,
} from '@/lib/writing/types';

const TEXT_EXT = new Set(['md', 'markdown', 'txt']);

export const KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE =
  'This file type is not supported. Attach Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, PDF, Markdown, or text files.';

export const KNOWLEDGE_ACCEPT = [
  ...['doc', 'docx', 'docm', 'ppt', 'pps', 'pot', 'pptx', 'pptm', 'ppsx', 'ppsm',
    'xls', 'xlsx', 'xlsm', 'xlsb', 'odt', 'ods', 'odp', 'rtf', 'epub', 'csv', 'pdf',
    'md', 'markdown', 'txt'],
].map((ext) => `.${ext}`).join(',');

export function isKnowledgeTextFilename(filename: string): boolean {
  return TEXT_EXT.has(fileExtension(filename));
}

export function isAllowedKnowledgeFilename(filename: string): boolean {
  return isOfficeFilename(filename) || isKnowledgeTextFilename(filename);
}
