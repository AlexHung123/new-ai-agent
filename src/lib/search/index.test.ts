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
        'newSfcAgent',
        'newSurveyAgent',
      ].sort(),
    );
  });
});
