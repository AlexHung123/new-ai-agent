import { describe, expect, it } from 'vitest';
import { parseChatBody } from './chatBodySchema';

const validWritingBody = {
  message: {
    messageId: 'm1',
    chatId: 'c1',
    content: 'helloo',
  },
  optimizationMode: 'speed',
  focusMode: 'agentWriting',
  history: [],
};

describe('parseChatBody', () => {
  it('accepts documentId null from agents that have no selected document', () => {
    const result = parseChatBody({
      ...validWritingBody,
      documentId: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.documentId).toBeNull();
    }
  });

  it('defaults htmlMode to false', () => {
    const result = parseChatBody(validWritingBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.htmlMode).toBe(false);
    }
  });

  it('accepts a WCMS content id for Agent HTML', () => {
    const result = parseChatBody({
      ...validWritingBody,
      focusMode: 'agentHtml',
      wcmsContentId: '15',
      wcmsPageIndex: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wcmsContentId).toBe('15');
      expect(result.data.wcmsPageIndex).toBe(1);
    }
  });

  it('accepts htmlReady so an empty editor snapshot can be distinguished from a not-yet-loaded canvas', () => {
    const result = parseChatBody({
      ...validWritingBody,
      focusMode: 'agentHtml',
      html: '',
      htmlReady: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.htmlReady).toBe(true);
      expect(result.data.html).toBe('');
    }
  });

  it('accepts live TinyMCE html for Agent HTML turns', () => {
    const result = parseChatBody({
      ...validWritingBody,
      focusMode: 'agentHtml',
      html: '<p>live</p>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.html).toBe('<p>live</p>');
    }
  });

  it('accepts htmlMode true', () => {
    const result = parseChatBody({
      ...validWritingBody,
      htmlMode: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.htmlMode).toBe(true);
    }
  });
});
