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
