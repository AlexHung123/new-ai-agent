import { describe, expect, it } from 'vitest';
import {
  formatKnowledgePin,
  isHiddenPublicFolder,
  knowledgeMentionToken,
  parseKnowledgeLibrary,
  parseKnowledgeLibraryStrict,
  parseKnowledgePin,
  pinTitle,
} from './library';

describe('knowledge library pins', () => {
  it('parses visibility and defaults to private', () => {
    expect(parseKnowledgeLibrary('public')).toBe('public');
    expect(parseKnowledgeLibrary('shared')).toBe('public');
    expect(parseKnowledgeLibrary('private')).toBe('private');
    expect(parseKnowledgeLibrary(undefined)).toBe('private');
    expect(parseKnowledgeLibraryStrict('all')).toBeNull();
  });

  it('formats and parses private and public pins', () => {
    expect(formatKnowledgePin({ library: 'public', path: 'spr' })).toBe('public:spr');
    expect(formatKnowledgePin({ library: 'private', path: 'notes' })).toBe(
      'private:notes',
    );
    expect(parseKnowledgePin('public:spr')).toEqual({
      library: 'public',
      path: 'spr',
    });
    expect(parseKnowledgePin('private/notes')).toEqual({
      library: 'private',
      path: 'notes',
    });
    expect(parseKnowledgePin('contracts/2024')).toEqual({
      library: 'private',
      path: 'contracts/2024',
    });
    expect(knowledgeMentionToken({ library: 'public', path: 'spr' })).toBe(
      'public/spr',
    );
  });

  it('hides the reserved sfc public folder and titles pins from the last segment', () => {
    expect(isHiddenPublicFolder('sfc')).toBe(true);
    expect(isHiddenPublicFolder('sfc/wiki')).toBe(true);
    expect(isHiddenPublicFolder('spr')).toBe(false);
    expect(pinTitle({ library: 'public', path: 'spr' })).toBe('spr');
  });
});
