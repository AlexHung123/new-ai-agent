import { EventEmitter } from 'events';
import { describe, expect, it } from 'vitest';
import type { PooledAgent } from '../search/shared/agent/piAgentSessionManager';
import { streamAgentProgressToEmitter } from './agentStream';

const DISCLAIMER =
  '<span class="text-red-500 font-bold">AI生成的回覆可能不準確，使用前請仔細核實。</span>\n\n';

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
        for (const listener of listeners) listener(event);
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

function collectLines(emitter: EventEmitter): unknown[] {
  const lines: unknown[] = [];
  emitter.on('data', (chunk: string) => {
    const raw = String(chunk).trim();
    if (!raw) return;
    lines.push(JSON.parse(raw));
  });
  return lines;
}

describe('streamAgentProgressToEmitter', () => {
  it('emits disclaimer then text deltas, then finished progress', async () => {
    const agent = createScriptedAgent([
      {
        type: 'message_update',
        assistantMessageEvent: { type: 'text_delta', delta: 'Hi' },
      },
      { type: 'agent_end' },
    ]);
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      safeJson: JSON.stringify,
    });
    await agent.prompt('q');
    const result = await done;

    expect(result.hasTextResponse).toBe(true);
    expect(lines).toEqual([
      { type: 'response', data: DISCLAIMER },
      { type: 'response', data: 'Hi' },
      {
        type: 'progress',
        data: {
          status: 'finished',
          total: 2,
          current: 2,
          message: 'SFC Kode Agent execution finished',
        },
      },
    ]);
  });

  it('maps tool start/end and collects sources from details.chunks', async () => {
    const agent = createScriptedAgent([
      {
        type: 'tool_execution_start',
        toolCallId: 't1',
        toolName: 'es_bm25_search',
        args: { query: 'q' },
      },
      {
        type: 'tool_execution_end',
        toolCallId: 't1',
        toolName: 'es_bm25_search',
        isError: false,
        result: {
          details: {
            chunks: [
              {
                content: 'chunk',
                document_link:
                  '<a href="https://example.com/doc">Year-Q1</a>',
              },
            ],
          },
        },
      },
      { type: 'agent_end' },
    ]);
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      safeJson: JSON.stringify,
    });
    await agent.prompt('q');
    await done;

    expect(lines).toContainEqual({
      type: 'tool_execution',
      data: {
        id: 't1',
        name: 'es_bm25_search',
        state: 'RUNNING',
        inputPreview: { query: 'q' },
      },
    });
    expect(lines).toContainEqual({
      type: 'sources',
      data: [
        {
          pageContent: 'chunk',
          metadata: { title: 'Year-Q1', url: 'https://example.com/doc' },
        },
      ],
    });
  });

  it('emits a file-path summary when fs_read completes', async () => {
    const agent = createScriptedAgent([
      {
        type: 'tool_execution_end',
        toolCallId: 't3',
        toolName: 'fs_read',
        isError: false,
        result: {
          details: { ok: true, rel: 'wiki/SCHEMA.md' },
        },
      },
      { type: 'agent_end' },
    ]);
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      safeJson: JSON.stringify,
    });
    await agent.prompt('q');
    await done;

    expect(lines).toContainEqual({
      type: 'tool_execution',
      data: {
        id: 't3',
        name: 'fs_read',
        state: 'COMPLETED',
        summary: 'Read wiki/SCHEMA.md',
        resultPreview: { ok: true, rel: 'wiki/SCHEMA.md' },
      },
    });
  });

  it('cancels the pi-ai run via agent.abort and waits for agent_end', async () => {
    const listeners = new Set<(event: any, signal?: AbortSignal) => void>();
    let abortCalls = 0;
    const agent: PooledAgent = {
      state: {
        systemPrompt: '',
        tools: [],
        messages: [],
        isStreaming: true,
      },
      async prompt() {},
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      abort() {
        abortCalls += 1;
      },
      async waitForIdle() {},
    };
    const emitter = new EventEmitter();
    const ac = new AbortController();
    let resolved = false;
    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      signal: ac.signal,
    }).then((result) => {
      resolved = true;
      return result;
    });

    ac.abort();
    await Promise.resolve();
    expect(abortCalls).toBe(1);
    expect(resolved).toBe(false);

    for (const listener of listeners) {
      listener({ type: 'agent_end' });
    }
    await done;
    expect(resolved).toBe(true);
  });

  it('emits tool_error when a tool ends with isError', async () => {
    const agent = createScriptedAgent([
      {
        type: 'tool_execution_end',
        toolCallId: 't2',
        toolName: 'guide_search',
        isError: true,
        result: { content: [{ type: 'text', text: 'boom' }] },
      },
      { type: 'agent_end' },
    ]);
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      safeJson: JSON.stringify,
    });
    await agent.prompt('q');
    await done;

    expect(lines).toContainEqual({
      type: 'tool_error',
      data: {
        id: 't2',
        name: 'guide_search',
        state: 'FAILED',
        error: 'boom',
      },
    });
  });

  it('emits emptyResponseFallback when the run ends with no text', async () => {
    const agent = createScriptedAgent([{ type: 'agent_end' }]);
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      emptyResponseFallback: 'Based on the provided document, I could not find any information regarding your question.',
    });
    await agent.prompt('q');
    const result = await done;

    expect(result.hasTextResponse).toBe(true);
    expect(lines).toContainEqual({ type: 'response', data: DISCLAIMER });
    expect(lines).toContainEqual({
      type: 'response',
      data: 'Based on the provided document, I could not find any information regarding your question.',
    });
  });

  it('emits LLM provider connection error instead of empty fallback', async () => {
    const agent = createScriptedAgent([{ type: 'agent_end' }]);
    agent.state.errorMessage = 'connect ECONNREFUSED 192.168.128.122:8000';
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      emptyResponseFallback:
        'Based on the provided document, I could not find any information regarding your question.',
    });
    await agent.prompt('q');
    const result = await done;

    expect(result.hasTextResponse).toBe(true);
    expect(lines).toContainEqual({
      type: 'response',
      data: 'LLM provider connection error.',
    });
    expect(lines).not.toContainEqual({
      type: 'response',
      data: 'Based on the provided document, I could not find any information regarding your question.',
    });
  });

  it('emits LLM provider connection error when the model does not exist', async () => {
    const agent = createScriptedAgent([
      {
        type: 'message_end',
        message: {
          role: 'assistant',
          content: [],
          stopReason: 'error',
          errorMessage:
            '404 The model `deepseek-ai/DeepSeek-V4-Flash-0731111` does not exist.',
        },
      },
      { type: 'agent_end' },
    ]);
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({
      agent,
      emitter,
      emptyResponseFallback:
        'Based on the provided document, I could not find any information regarding your question.',
    });
    await agent.prompt('q');
    const result = await done;

    expect(result.hasTextResponse).toBe(true);
    expect(lines).toContainEqual({
      type: 'response',
      data: 'LLM provider connection error.',
    });
    expect(lines).not.toContainEqual({
      type: 'response',
      data: 'Based on the provided document, I could not find any information regarding your question.',
    });
  });

  it('emits LLM provider connection error when a failed LLM turn has no empty fallback', async () => {
    const agent = createScriptedAgent([
      {
        type: 'message_end',
        message: {
          role: 'assistant',
          content: [],
          stopReason: 'error',
          errorMessage:
            '404 The model `deepseek-ai/DeepSeek-V4-Flash-0731111` does not exist.',
        },
      },
      { type: 'agent_end' },
    ]);
    const emitter = new EventEmitter();
    const lines = collectLines(emitter);

    const done = streamAgentProgressToEmitter({ agent, emitter });
    await agent.prompt('q');
    await done;

    expect(lines).toContainEqual({
      type: 'response',
      data: 'LLM provider connection error.',
    });
  });
});
