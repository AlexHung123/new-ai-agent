import { describe, expect, it } from 'vitest';
import { completePiAgent } from './completePiAgent';
import type { PooledAgent } from './piAgentSessionManager';

function createScriptedAgent(
  events: Array<Record<string, unknown>>,
): PooledAgent {
  const listeners = new Set<(event: any, signal?: AbortSignal) => void>();

  return {
    state: {
      systemPrompt: '',
      tools: [],
      messages: [],
      isStreaming: false,
    },
    async prompt() {
      for (const event of events) {
        for (const listener of listeners) {
          listener(event);
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    abort() {},
    async waitForIdle() {},
  };
}

function createStreamingAgent(deltas: string[]): PooledAgent {
  return createScriptedAgent(
    deltas.map((delta) => ({
      type: 'message_update',
      assistantMessageEvent: { type: 'text_delta', delta },
    })),
  );
}

const SURVEY_CHAT_USER_PROMPT =
  '你是通用對話助理（Kode agent），同時具備 LimeSurvey 自由文字問卷分析能力。請用繁體中文回覆。\n\n## 使用者最新訊息\n你好';

function userPromptEndEvent(text: string) {
  return {
    type: 'message_end',
    message: {
      role: 'user',
      content: [{ type: 'text', text }],
    },
  };
}

function assistantEndEvent(text: string) {
  return {
    type: 'message_end',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
    },
  };
}

describe('completePiAgent', () => {
  it('collects streamed assistant text from prompt()', async () => {
    const agent = createStreamingAgent(['hel', 'lo']);
    const result = await completePiAgent(agent, 'hi');
    expect(result).toEqual({ status: 'ok', text: 'hello' });
  });

  it('returns empty text when the model streams nothing', async () => {
    const agent = createStreamingAgent([]);
    const result = await completePiAgent(agent, 'hi');
    expect(result).toEqual({ status: 'ok', text: '' });
  });

  it('aborts the pi-ai run and returns partial text', async () => {
    const listeners = new Set<(event: any, signal?: AbortSignal) => void>();
    let abortCalls = 0;
    let releasePrompt: (() => void) | undefined;
    const agent: PooledAgent = {
      state: {
        systemPrompt: '',
        tools: [],
        messages: [],
        isStreaming: true,
      },
      async prompt() {
        for (const listener of listeners) {
          listener({
            type: 'message_update',
            assistantMessageEvent: { type: 'text_delta', delta: 'hel' },
          });
        }
        await new Promise<void>((resolve) => {
          releasePrompt = resolve;
        });
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      abort() {
        abortCalls += 1;
        releasePrompt?.();
      },
      async waitForIdle() {},
    };

    const ac = new AbortController();
    const pending = completePiAgent(agent, 'hi', ac.signal);
    await Promise.resolve();
    ac.abort();
    const result = await pending;

    expect(abortCalls).toBe(1);
    expect(result).toEqual({ status: 'aborted', text: 'hel' });
  });

  it('does not treat the user prompt message_end as the reply', async () => {
    const agent = createScriptedAgent([
      userPromptEndEvent(SURVEY_CHAT_USER_PROMPT),
      {
        type: 'message_update',
        assistantMessageEvent: { type: 'text_delta', delta: '你好！' },
      },
      {
        type: 'message_update',
        assistantMessageEvent: { type: 'text_delta', delta: '有什麼可以幫忙？' },
      },
      assistantEndEvent('你好！有什麼可以幫忙？'),
    ]);

    const result = await completePiAgent(agent, SURVEY_CHAT_USER_PROMPT);

    expect(result).toEqual({
      status: 'ok',
      text: '你好！有什麼可以幫忙？',
    });
    expect(result.text).not.toContain('你是通用對話助理');
  });

  it('uses the assistant message_end when the provider does not stream deltas', async () => {
    const agent = createScriptedAgent([
      userPromptEndEvent(SURVEY_CHAT_USER_PROMPT),
      assistantEndEvent('這段文字的重點是…'),
    ]);

    const result = await completePiAgent(agent, SURVEY_CHAT_USER_PROMPT);

    expect(result).toEqual({
      status: 'ok',
      text: '這段文字的重點是…',
    });
  });
});
