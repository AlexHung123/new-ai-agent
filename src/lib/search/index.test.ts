import { describe, expect, it } from 'vitest';
import { searchHandlers } from './index';

describe('searchHandlers', () => {
  it('registers only remaining chat flows', () => {
    expect(Object.keys(searchHandlers).sort()).toEqual(
      [
        'agentGuide',
        'agentSFC',
        'agentDocument',
        'agentReader',
        'agentWriting',
        'newSfcAgent',
        'newSurveyAgent',
        'sfcDocumentAgent',
      ].sort(),
    );
  });

  it('routes Agent SFC Document Q&A through the document agent', () => {
    expect(searchHandlers.sfcDocumentAgent).toBe(searchHandlers.agentDocument);
  });
});
