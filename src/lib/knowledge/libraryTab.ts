import type { KnowledgeLibrary } from './library';

export const KNOWLEDGE_LIBRARY_TAB_STORAGE_KEY = 'knowledge-library-tab';

export function parseLibraryTab(raw: unknown): KnowledgeLibrary {
  return raw === 'public' ? 'public' : 'private';
}

export function readLibraryTab(): KnowledgeLibrary {
  if (typeof window === 'undefined') return 'private';
  try {
    return parseLibraryTab(
      window.sessionStorage.getItem(KNOWLEDGE_LIBRARY_TAB_STORAGE_KEY),
    );
  } catch {
    return 'private';
  }
}

export function writeLibraryTab(library: KnowledgeLibrary): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(KNOWLEDGE_LIBRARY_TAB_STORAGE_KEY, library);
  } catch {
    /* ignore quota / private mode */
  }
}
