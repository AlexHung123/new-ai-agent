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

  it('accepts optional knowledgeFolder', () => {
    const result = parseChatBody({
      ...validWritingBody,
      knowledgeFolder: 'contracts/2024',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.knowledgeFolder).toBe('contracts/2024');
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

  it('accepts an image-only Agent HTML turn', () => {
    const result = parseChatBody({
      ...validWritingBody,
      focusMode: 'agentHtml',
      message: { ...validWritingBody.message, content: '' },
      images: [{ type: 'image', data: 'AAAA', mimeType: 'image/png' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message.content).toBe('');
      expect(result.data.images).toHaveLength(1);
    }
  });

  it('rejects an empty message when no image is attached', () => {
    const result = parseChatBody({
      ...validWritingBody,
      message: { ...validWritingBody.message, content: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an 11th image', () => {
    const result = parseChatBody({
      ...validWritingBody,
      images: Array.from({ length: 11 }, () => ({
        type: 'image',
        data: 'AAAA',
        mimeType: 'image/png',
      })),
    });
    expect(result.success).toBe(false);
  });
});
