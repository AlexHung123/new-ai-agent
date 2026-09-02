import { describe, expect, it } from 'vitest';
import {
  PPT_FOCUS_MODE,
  SFC_DOCUMENT_FOCUS_MODE,
  SFC_DOCUMENT_ID,
  SFC_REPLY_FOCUS_MODE,
  findDisplayFocusMode,
  focusModes,
  isSfcFocusMode,
  resolveFocusMode,
  resolveLoadedFocusMode,
  shouldPersistFocusMode,
  usesWritingLibrary,
} from './agents';

describe('focusModes', () => {
  it('exposes remaining chat agents plus the voice tool', () => {
    expect(focusModes.map((mode) => mode.key)).toEqual([
      'agentSFC',
      'newSurveyAgent',
      'agentWriting',
      'agentPpt',
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
    expect(resolveFocusMode(SFC_REPLY_FOCUS_MODE)).toBe(SFC_REPLY_FOCUS_MODE);
    expect(resolveFocusMode(SFC_DOCUMENT_FOCUS_MODE)).toBe(
      SFC_DOCUMENT_FOCUS_MODE,
    );
    expect(resolveFocusMode('newSurveyAgent')).toBe('newSurveyAgent');
    expect(resolveFocusMode('agentWriting')).toBe('agentWriting');
    expect(resolveFocusMode('agentPpt')).toBe('agentPpt');
    expect(resolveFocusMode('agentDocument')).toBe('agentDocument');
  });

  it('maps internal SFC modes to the Agent SFC card', () => {
    expect(isSfcFocusMode('agentSFC')).toBe(true);
    expect(isSfcFocusMode(SFC_REPLY_FOCUS_MODE)).toBe(true);
    expect(isSfcFocusMode(SFC_DOCUMENT_FOCUS_MODE)).toBe(true);
    expect(isSfcFocusMode('agentDocument')).toBe(false);
    expect(findDisplayFocusMode(SFC_DOCUMENT_FOCUS_MODE)?.key).toBe('agentSFC');
    expect(SFC_DOCUMENT_ID).toBe('sfc');
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

  it('shares the writing file library with Agent PPT', () => {
    expect(usesWritingLibrary('agentWriting')).toBe(true);
    expect(usesWritingLibrary(PPT_FOCUS_MODE)).toBe(true);
    expect(usesWritingLibrary('agentSFC')).toBe(false);
  });

  it('keeps Agent Voice when loading an existing history chat', () => {
    expect(resolveLoadedFocusMode('agentVoice')).toBe('agentVoice');
    expect(resolveLoadedFocusMode('agentWriting')).toBe('agentWriting');
    expect(resolveLoadedFocusMode('agentGuide')).toBe('agentSFC');
  });

  it('does not persist tool agents as the next new-chat focus mode', () => {
    expect(shouldPersistFocusMode('agentVoice')).toBe(false);
    expect(shouldPersistFocusMode('agentWriting')).toBe(true);
    expect(shouldPersistFocusMode('agentSFC')).toBe(true);
  });
});
