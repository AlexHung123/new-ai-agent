import { describe, expect, it } from 'vitest';
import { applyTranscriptCheckpoints } from '../runtime/agentTranscriptCheckpoint';
import { createMemoryAgentTranscriptStore } from '../runtime/agentTranscriptStore';
import { createMemoryPiSessionStore } from '../runtime/piSessionStore';
import {
  createPiAgentSessionManager,
  messagesHaveToolHistory,
  type CreatePooledAgentOptions,
  type PooledAgent,
} from './piAgentSessionManager';

function createFakeAgent(opts: CreatePooledAgentOptions): PooledAgent {
  return {
    sessionId: opts.sessionId,
    state: {
      systemPrompt: opts.systemPrompt,
      tools: opts.tools.map((t) => ({ name: t.name })),
      messages: [...opts.messages],
      isStreaming: false,
    },
    async prompt(input: string) {
      this.state.messages = [
        ...this.state.messages,
        { role: 'user', content: input },
        { role: 'assistant', content: 'ok' },
      ];
    },
    subscribe() {
      return () => undefined;
    },
    abort() {},
    async waitForIdle() {},
  };
}

function createManager(maxActiveAgents = 2) {
  const store = createMemoryPiSessionStore();
  const transcript = createMemoryAgentTranscriptStore();
  const created: PooledAgent[] = [];
  const manager = createPiAgentSessionManager({
    defaultAgentId: 'rag-chat-agent-default',
    maxActiveAgents,
    store,
    transcript,
    templates: {
      'rag-base-template': {
        id: 'rag-base-template',
        systemPrompt: 'base',
        tools: [],
      },
      'writing-agent-template': {
        id: 'writing-agent-template',
        systemPrompt: 'write',
        tools: ['fs_ls', 'fs_read'],
      },
    },
    tools: {
      es_bm25_search: { name: 'es_bm25_search' },
      guide_search: { name: 'guide_search' },
      fs_ls: { name: 'fs_ls' },
      fs_read: { name: 'fs_read' },
    },
    createAgent: (opts) => {
      const agent = createFakeAgent(opts);
      created.push(agent);
      return agent;
    },
  });
  return { manager, store, transcript, created };
}

describe('messagesHaveToolHistory', () => {
  it('detects assistant toolCall blocks and toolResult rows', () => {
    expect(
      messagesHaveToolHistory([
        {
          role: 'assistant',
          content: [{ type: 'toolCall', id: 'tc1', name: 'fs_read' }],
        },
      ]),
    ).toBe(true);
    expect(
      messagesHaveToolHistory([
        { role: 'toolResult', toolCallId: 'tc1', toolName: 'fs_read' },
      ]),
    ).toBe(true);
  });

  it('is false for plain user/assistant text', () => {
    expect(
      messagesHaveToolHistory([
        { role: 'user', content: 'hello' },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi there' }],
        },
      ]),
    ).toBe(false);
  });
});

describe('createPiAgentSessionManager', () => {
  it('normalizes empty and whitespace ids to the default', () => {
    const { manager } = createManager();
    expect(manager.normalizeAgentId()).toBe('rag-chat-agent-default');
    expect(manager.normalizeAgentId('   ')).toBe('rag-chat-agent-default');
    expect(manager.normalizeAgentId(' chat-9 ')).toBe('chat-9');
  });

  it('returns the same in-memory agent for the same id', async () => {
    const { manager } = createManager();
    const a = await manager.getOrCreateAgent('c1', ['es_bm25_search']);
    const b = await manager.getOrCreateAgent('c1', ['es_bm25_search']);
    expect(a).toBe(b);
  });

  it('applies template prompt and tool override on create', async () => {
    const { manager } = createManager();
    const agent = await manager.getOrCreateAgent(
      'c1',
      ['es_bm25_search'],
      'writing-agent-template',
    );
    expect(agent.state.systemPrompt).toBe('write');
    expect(agent.state.tools.map((t) => t.name)).toEqual(['es_bm25_search']);
  });

  it('creates with no tools when override is empty and history has none', async () => {
    const { manager } = createManager();
    const agent = await manager.getOrCreateAgent(
      'c1',
      [],
      'writing-agent-template',
    );
    expect(agent.state.tools).toEqual([]);
  });

  it('does not strip tools from an existing session when a later turn passes an empty override', async () => {
    const { manager } = createManager();
    const agent = await manager.getOrCreateAgent('c1', [
      'es_bm25_search',
    ]);
    agent.state.messages.push({
      role: 'assistant',
      content: [
        {
          type: 'toolCall',
          id: 'tc1',
          name: 'es_bm25_search',
          arguments: {},
        },
      ],
    });
    const again = await manager.getOrCreateAgent('c1', []);
    expect(again).toBe(agent);
    expect(again.state.tools.map((t) => t.name)).toEqual(['es_bm25_search']);
  });

  it('restores template tools when an in-memory session lost them but still has tool history', async () => {
    const { manager } = createManager();
    const agent = await manager.getOrCreateAgent(
      'c1',
      ['fs_read'],
      'writing-agent-template',
    );
    agent.state.messages.push({
      role: 'toolResult',
      toolCallId: 'tc1',
      toolName: 'fs_read',
      content: [{ type: 'text', text: 'doc body' }],
    });
    agent.state.tools = [];
    const again = await manager.getOrCreateAgent(
      'c1',
      [],
      'writing-agent-template',
    );
    expect(again.state.tools.map((t) => t.name)).toEqual(['fs_ls', 'fs_read']);
  });

  it('uses template tools when hydrating a session that already has tool history', async () => {
    const { manager, store } = createManager();
    await store.save('keep', {
      templateId: 'writing-agent-template',
      messages: [
        { role: 'user', content: 'summarize @memo.docx', timestamp: 1 },
        {
          role: 'assistant',
          content: [
            { type: 'toolCall', id: 'tc1', name: 'fs_read', arguments: {} },
          ],
          timestamp: 2,
        },
        {
          role: 'toolResult',
          toolCallId: 'tc1',
          toolName: 'fs_read',
          content: [{ type: 'text', text: 'doc body' }],
          timestamp: 3,
        },
      ],
    });
    const agent = await manager.getOrCreateAgent(
      'keep',
      [],
      'writing-agent-template',
    );
    expect(agent.state.tools.map((t) => t.name)).toEqual(['fs_ls', 'fs_read']);
  });

  it('evicts the least recently used idle agent when full', async () => {
    const { manager, created } = createManager(2);
    const first = await manager.getOrCreateAgent('a');
    await manager.getOrCreateAgent('b');
    manager.touchAgent('a');
    await manager.getOrCreateAgent('c');
    expect(created).toHaveLength(3);
    const again = await manager.getOrCreateAgent('a');
    expect(again).toBe(first);
    const reopened = await manager.getOrCreateAgent('b');
    expect(reopened).not.toBe(created[1]);
  });

  it('does not evict a busy agent', async () => {
    const { manager } = createManager(1);
    await manager.getOrCreateAgent('busy-one');
    manager.markBusy('busy-one');
    await expect(manager.getOrCreateAgent('other')).rejects.toThrow(
      /Agent pool is full/,
    );
  });

  it('reloads persisted messages after eviction', async () => {
    const { manager } = createManager(1);
    const first = await manager.getOrCreateAgent('keep');
    await first.prompt('remember me');
    await manager.markIdle('keep');
    await manager.getOrCreateAgent('other');
    const reloaded = await manager.getOrCreateAgent('keep');
    expect(reloaded.state.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'remember me' }),
      ]),
    );
  });

  it('seeds pi_sessions messages into an empty transcript on cold create', async () => {
    const { manager, store, transcript } = createManager();
    await store.save('keep', {
      templateId: 'rag-base-template',
      messages: [
        { role: 'user', content: 'seeded', timestamp: 1 },
        { role: 'assistant', content: [{ type: 'text', text: 'ok' }], timestamp: 2 },
      ],
    });
    const agent = await manager.getOrCreateAgent('keep');
    expect(agent.state.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'seeded' }),
      ]),
    );
    const rows = await transcript.loadMessages('keep');
    expect(rows.some((m) => m.content === 'seeded')).toBe(true);
  });

  it('keeps old transcript rows after hydrate compaction', async () => {
    const { manager, store, transcript } = createManager();
    const pad = (n: number) => 'x'.repeat(n * 4);
    await store.save('keep', {
      templateId: 'rag-base-template',
      messages: [
        { role: 'user', content: pad(8_000), timestamp: 1 },
        {
          role: 'assistant',
          content: [{ type: 'text', text: pad(8_000) }],
          timestamp: 2,
        },
        { role: 'user', content: pad(8_000), timestamp: 3 },
        {
          role: 'assistant',
          content: [{ type: 'text', text: pad(8_000) }],
          timestamp: 4,
        },
        { role: 'user', content: 'latest question', timestamp: 5 },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'latest answer' }],
          timestamp: 6,
        },
      ],
    });
    const prev = process.env.AGENT_COMPACTION_MAX_TOKENS;
    process.env.AGENT_COMPACTION_MAX_TOKENS = '100';
    process.env.AGENT_COMPACTION_COMPRESS_TO_TOKENS = '50';
    try {
      const agent = await manager.getOrCreateAgent('keep');
      expect(agent.state.messages[0]).toMatchObject({
        role: 'compactionSummary',
      });
      const raw = await transcript.loadMessages('keep');
      expect(raw.length).toBeGreaterThan(agent.state.messages.length);
      expect(raw.some((m) => m.content === 'latest question')).toBe(true);
      const view = applyTranscriptCheckpoints(raw);
      expect(view[0].role).toBe('compactionSummary');
      expect(
        view.some(
          (m) => m.role === 'user' && String(m.content).includes('latest question'),
        ),
      ).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.AGENT_COMPACTION_MAX_TOKENS;
      else process.env.AGENT_COMPACTION_MAX_TOKENS = prev;
      delete process.env.AGENT_COMPACTION_COMPRESS_TO_TOKENS;
    }
  });
});
