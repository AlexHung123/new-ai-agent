import { describe, expect, it } from 'vitest';
import { clusterQuestionViaKodeAgent } from './clusterViaKodeAgent';

describe('clusterQuestionViaKodeAgent', () => {
  it('surfaces LLM provider connection errors instead of parsing them as JSON', async () => {
    await expect(
      clusterQuestionViaKodeAgent({
        agent: {
          complete: async () => ({
            status: 'error',
            text: 'LLM provider connection error.',
          }),
        },
        question: 'Q1',
        items: [
          { id: '1', text: 'a' },
          { id: '2', text: 'b' },
        ],
        maxRetries: 0,
      }),
    ).rejects.toThrow('LLM provider connection error.');
  });
});
