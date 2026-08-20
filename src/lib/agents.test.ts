import { describe, expect, it } from 'vitest';
import { focusModes, resolveFocusMode } from './agents';

describe('focusModes', () => {
  it('exposes only remaining chat agents in the picker', () => {
    expect(focusModes.map((mode) => mode.key)).toEqual([
      'agentGuide',
      'agentSFC',
      'newSurveyAgent',
      'agentWriting',
      'agentDocument',
    ]);
  });
});

describe('resolveFocusMode', () => {
  it('keeps remaining chat modes', () => {
    expect(resolveFocusMode('agentGuide')).toBe('agentGuide');
    expect(resolveFocusMode('agentSFC')).toBe('agentSFC');
    expect(resolveFocusMode('newSfcAgent')).toBe('newSfcAgent');
    expect(resolveFocusMode('newSurveyAgent')).toBe('newSurveyAgent');
    expect(resolveFocusMode('agentWriting')).toBe('agentWriting');
    expect(resolveFocusMode('agentDocument')).toBe('agentDocument');
  });

  it('maps leftover survey mode to the pi survey agent', () => {
    expect(resolveFocusMode('agentSurvey')).toBe('newSurveyAgent');
  });

  it('falls back to Agent SFC for removed or unknown modes', () => {
    expect(resolveFocusMode('agentData')).toBe('agentSFC');
    expect(resolveFocusMode('agentImage')).toBe('agentSFC');
    expect(resolveFocusMode('webSearch')).toBe('agentSFC');
    expect(resolveFocusMode(undefined)).toBe('agentSFC');
    expect(resolveFocusMode(null)).toBe('agentSFC');
  });
});
