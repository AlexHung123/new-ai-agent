import { describe, expect, it } from 'vitest';
import { searchHandlers } from './index';

describe('searchHandlers', () => {
  it('registers only remaining chat flows', () => {
    expect(Object.keys(searchHandlers).sort()).toEqual(
      [
        'agentGuide',
        'agentSFC',
        'agentDocument',
        'agentWriting',
        'agentKnowledge',
        'agentHtml',
        'newSfcAgent',
        'newSurveyAgent',
        'sfcDocumentAgent',
      ].sort(),
    );
  });

  it('routes Agent Knowledge aliases to the same writing agent', () => {
    expect(searchHandlers.agentKnowledge).toBe(searchHandlers.agentWriting);
    expect(searchHandlers.agentDocument).toBe(searchHandlers.agentWriting);
  });

  it('keeps Agent SFC Document Q&A on the document agent', () => {
    expect(searchHandlers.sfcDocumentAgent).not.toBe(searchHandlers.agentDocument);
  });
});
