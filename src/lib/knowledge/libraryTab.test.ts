import { describe, expect, it } from 'vitest';
import { parseLibraryTab } from './libraryTab';

describe('parseLibraryTab', () => {
  it('accepts public and defaults everything else to private', () => {
    expect(parseLibraryTab('public')).toBe('public');
    expect(parseLibraryTab('private')).toBe('private');
    expect(parseLibraryTab('all')).toBe('private');
    expect(parseLibraryTab(undefined)).toBe('private');
  });
});
