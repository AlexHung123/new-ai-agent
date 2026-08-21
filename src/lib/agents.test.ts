import { describe, expect, it } from 'vitest';
import { focusModes, resolveFocusMode } from './agents';

describe('focusModes', () => {
  it('exposes remaining chat agents plus the voice tool', () => {
    expect(focusModes.map((mode) => mode.key)).toEqual([
      'agentSFC',
      'newSurveyAgent',
      'agentWriting',
      'agentDocument',
      'agentVoice',
    ]);
    expect(focusModes.some((mode) => mode.key === 'agentGuide')).toBe(false);
  });

  it('uses a distinct document illustration for Agent Document', () => {
    const documentAgent = focusModes.find(
      (mode) => mode.key === 'agentDocument',
    );
    const writingAgent = focusModes.find((mode) => mode.key === 'agentWriting');
    expect(documentAgent?.image).toBe('/itms/ai/agent-document.png');
    expect(documentAgent?.image).not.toBe(writingAgent?.image);
  });

  it('opens Agent Voice as a TTS tool with the voice illustration', () => {
    const voiceAgent = focusModes.find((mode) => mode.key === 'agentVoice');
    expect(voiceAgent?.image).toBe('/itms/ai/agent-voice.png');
    expect(voiceAgent?.kind).toBe('tool');
    expect(voiceAgent?.href).toBe('/voice');
    expect(voiceAgent?.permissionCode).toBe('chatVoiceAgent:execute');
  });
});

describe('resolveFocusMode', () => {
  it('keeps remaining chat modes', () => {
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
    expect(resolveFocusMode('agentGuide')).toBe('agentSFC');
    expect(resolveFocusMode('agentData')).toBe('agentSFC');
    expect(resolveFocusMode('agentImage')).toBe('agentSFC');
    expect(resolveFocusMode('webSearch')).toBe('agentSFC');
    expect(resolveFocusMode(undefined)).toBe('agentSFC');
    expect(resolveFocusMode(null)).toBe('agentSFC');
  });

  it('does not treat Agent Voice as a chat focus mode', () => {
    expect(resolveFocusMode('agentVoice')).toBe('agentSFC');
  });
});
