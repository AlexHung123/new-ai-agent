import { describe, expect, it } from 'vitest';
import {
  applyMidRunContextGuard,
  analyzeContext,
  buildSummaryUserMessage,
  capOversizedToolResults,
  compactMessagesIfNeeded,
  estimateMessageTokens,
  estimateMessagesTokens,
  findKeepFromIndex,
  findKeepFromIndexForMultimodal,
  formatContextManageLog,
  generateLocalSummary,
  getAgentCompactionSettings,
  getMaxToolResultChars,
  shouldCompact,
  snapKeepFromForToolIntegrity,
  type AgentCompactionSettings,
  type CompactableMessage,
} from './agentCompaction';

function user(text: string): CompactableMessage {
  return { role: 'user', content: text, timestamp: 1 };
}

function assistant(text: string): CompactableMessage {
  return {
    role: 'assistant',
    content: [{ type: 'text', text }],
    timestamp: 1,
  };
}

function toolResult(text: string, toolName = 'retrieve_chunks'): CompactableMessage {
  return {
    role: 'toolResult',
    toolName,
    content: [{ type: 'text', text }],
    timestamp: 1,
  };
}

/** ~N tokens via chars/4 heuristic (padding with 'x'). */
function padTokens(approxTokens: number): string {
  return 'x'.repeat(Math.max(1, approxTokens * 4));
}

function defaultSettings(
  overrides: Partial<AgentCompactionSettings> = {},
): AgentCompactionSettings {
  return {
    enabled: true,
    maxTokens: 50_000,
    compressToTokens: 30_000,
    minKeepRatio: 0.6,
    keepRecentMultimodal: 3,
    ...overrides,
  };
}

describe('getAgentCompactionSettings', () => {
  it('defaults to kode-like max/compress/minKeep', () => {
    const s = getAgentCompactionSettings({});
    expect(s.enabled).toBe(true);
    expect(s.maxTokens).toBe(50_000);
    expect(s.compressToTokens).toBe(30_000);
    expect(s.minKeepRatio).toBe(0.6);
    expect(s.keepRecentMultimodal).toBe(3);
  });

  it('can disable via env', () => {
    expect(getAgentCompactionSettings({ AGENT_COMPACTION_ENABLED: 'false' }).enabled).toBe(
      false,
    );
  });

  it('accepts MAX_TOKENS and falls back to THRESHOLD_TOKENS', () => {
    expect(
      getAgentCompactionSettings({ AGENT_COMPACTION_MAX_TOKENS: '80000' }).maxTokens,
    ).toBe(80_000);
    expect(
      getAgentCompactionSettings({ AGENT_COMPACTION_THRESHOLD_TOKENS: '120000' }).maxTokens,
    ).toBe(120_000);
  });
});

describe('shouldCompact / analyzeContext', () => {
  it('compacts only when over maxTokens and enabled', () => {
    const cfg = defaultSettings({ maxTokens: 1000 });
    expect(shouldCompact(500, cfg)).toBe(false);
    expect(shouldCompact(1500, cfg)).toBe(true);
    expect(shouldCompact(1500, { ...cfg, enabled: false })).toBe(false);
  });

  it('analyzeContext sets shouldCompress from total tokens', () => {
    const messages = [user(padTokens(2_000)), assistant(padTokens(2_000))];
    const usage = analyzeContext(messages, defaultSettings({ maxTokens: 1_000 }));
    expect(usage.totalTokens).toBeGreaterThan(1_000);
    expect(usage.shouldCompress).toBe(true);
    expect(usage.messageCount).toBe(2);
  });
});

describe('estimateMessageTokens', () => {
  it('estimates text roughly as chars/4', () => {
    const m = user('abcd'.repeat(100)); // 400 chars → 100 tokens
    expect(estimateMessageTokens(m)).toBe(100);
  });

  it('counts tool call arguments on assistant', () => {
    const m: CompactableMessage = {
      role: 'assistant',
      content: [
        {
          type: 'toolCall',
          name: 'retrieve_chunks',
          arguments: { question: 'hello world' },
        },
      ],
    };
    expect(estimateMessageTokens(m)).toBeGreaterThan(1);
  });

  it('uses flat 500 tokens for image blocks', () => {
    const m: CompactableMessage = {
      role: 'user',
      content: [{ type: 'image', data: 'AAAA' }],
    };
    expect(estimateMessageTokens(m)).toBe(500);
  });
});

describe('findKeepFromIndex (kode ratio)', () => {
  it('keeps at least minKeepRatio of messages by count', () => {
    // 10 messages, over threshold → keep max(targetRatio, 0.6) * 10 ≥ 6
    const msgs = Array.from({ length: 10 }, (_, i) =>
      i % 2 === 0 ? user(padTokens(2_000)) : assistant(padTokens(2_000)),
    );
    const settings = defaultSettings({
      maxTokens: 100,
      compressToTokens: 50,
      minKeepRatio: 0.6,
    });
    const total = estimateMessagesTokens(msgs);
    const cut = findKeepFromIndex(msgs, settings, total);
    const kept = msgs.length - cut;
    expect(kept).toBeGreaterThanOrEqual(Math.ceil(10 * 0.6));
    expect(cut).toBeGreaterThan(0);
  });

  it('returns 0 when keep ratio would retain everything', () => {
    const msgs = [user('hi'), assistant('yo')];
    const settings = defaultSettings({ minKeepRatio: 1 });
    const cut = findKeepFromIndex(msgs, settings, 100);
    expect(cut).toBe(0);
  });
});

describe('snapKeepFromForToolIntegrity', () => {
  it('does not start kept tail on a toolResult', () => {
    const msgs: CompactableMessage[] = [
      user('old'),
      assistant('call'),
      toolResult('big'),
      user('new'),
    ];
    // Raw cut on toolResult index 2 → snap back to user(0) or assistant(1)
    const cut = snapKeepFromForToolIntegrity(msgs, 2);
    expect(cut).toBeLessThanOrEqual(1);
    expect(msgs[cut].role).not.toBe('toolResult');
  });
});

describe('findKeepFromIndexForMultimodal', () => {
  it('pulls keep-from earlier to retain recent images', () => {
    const msgs: CompactableMessage[] = [
      user('old text'),
      {
        role: 'user',
        content: [{ type: 'image', data: 'x' }, { type: 'text', text: 'see' }],
      },
      assistant('ok'),
      user('latest'),
    ];
    expect(findKeepFromIndexForMultimodal(msgs, 1)).toBe(1);
    expect(findKeepFromIndexForMultimodal(msgs, 0)).toBe(msgs.length);
  });
});

describe('generateLocalSummary', () => {
  it('builds a preview without calling an LLM', () => {
    const text = generateLocalSummary([
      user('What is RAG?'),
      assistant('Retrieval augmented generation...'),
      toolResult('chunk about RAG'),
    ]);
    expect(text).toContain('[user]');
    expect(text).toContain('What is RAG?');
    expect(text).toContain('[result');
  });

  it('keeps a prior compactionSummary body intact and only previews newly dropped turns', () => {
    const prior = `PRIOR-CHECKPOINT\n${'Z'.repeat(400)}`;
    const text = generateLocalSummary([
      buildSummaryUserMessage(prior, 9_000),
      user('What is RAG?'),
      assistant('Retrieval augmented generation...'),
    ]);
    expect(text).toContain(prior);
    expect(text).toContain('What is RAG?');
    expect(text).not.toMatch(/\[compactionSummary\]/);
  });

  it('still clips newly dropped non-summary messages to 200 chars', () => {
    const text = generateLocalSummary([user('Q'.repeat(500))]);
    expect(text).toContain('Q'.repeat(200));
    expect(text).not.toContain('Q'.repeat(201));
  });
});

describe('compactMessagesIfNeeded', () => {
  it('no-ops under maxTokens', () => {
    const messages = [user('a'), assistant('b')];
    const result = compactMessagesIfNeeded({
      messages,
      settings: defaultSettings({ maxTokens: 50_000 }),
    });
    expect(result.compacted).toBe(false);
    expect(result.messages).toEqual(messages);
  });

  it('prepends local summary and keeps recent tail', () => {
    const messages = [
      user(padTokens(8_000)),
      assistant(padTokens(8_000)),
      user(padTokens(8_000)),
      assistant(padTokens(8_000)),
      user('latest question'),
      assistant('latest answer'),
    ];

    const result = compactMessagesIfNeeded({
      messages,
      settings: defaultSettings({
        maxTokens: 100, // force compact
        compressToTokens: 50,
        minKeepRatio: 0.5,
      }),
    });

    expect(result.compacted).toBe(true);
    expect(result.hardDrop).toBe(false);
    expect(result.messages[0].role).toBe('compactionSummary');
    expect(result.messages[0]._compaction).toBe(true);
    expect(String(result.messages[0].summary || '')).toContain('[user]');
    expect(
      result.messages.some(
        (m) => m.role === 'user' && String(m.content).includes('latest question'),
      ),
    ).toBe(true);
    expect(result.tokensAfter).toBeLessThan(result.tokensBefore);
    expect(result.ratio).toBeLessThan(1);
    expect(result.firstKeptTimestamp).toBeGreaterThan(0);
    expect(result.hardDrop).toBe(false);
  });

  it('on a second compact keeps the previous summary whole', () => {
    const prior = `KEEP-ME-WHOLE\n${'Z'.repeat(400)}`;
    const messages = [
      buildSummaryUserMessage(prior, 12_000),
      user(padTokens(8_000)),
      assistant(padTokens(8_000)),
      user(padTokens(8_000)),
      assistant(padTokens(8_000)),
      user('latest question'),
      assistant('latest answer'),
    ];

    const result = compactMessagesIfNeeded({
      messages,
      settings: defaultSettings({
        maxTokens: 100,
        compressToTokens: 50,
        minKeepRatio: 0.5,
      }),
    });

    expect(result.compacted).toBe(true);
    const summary = String(result.messages[0].summary || '');
    expect(summary).toContain(prior);
    expect(summary).toContain('[user]');
  });
});

describe('buildSummaryUserMessage', () => {
  it('builds a compactionSummary node (convertToLlm formats for the model)', () => {
    const m = buildSummaryUserMessage('hello', 999);
    expect(m.role).toBe('compactionSummary');
    expect(m._compaction).toBe(true);
    expect(String(m.summary)).toBe('hello');
    expect(String(m.content)).toContain('hello');
    expect(m.tokensBefore).toBe(999);
  });
});

describe('estimateMessagesTokens', () => {
  it('sums message estimates', () => {
    const msgs = [user(padTokens(10)), assistant(padTokens(20))];
    expect(estimateMessagesTokens(msgs)).toBe(
      estimateMessageTokens(msgs[0]) + estimateMessageTokens(msgs[1]),
    );
  });
});

describe('capOversizedToolResults', () => {
  it('no-ops when under maxChars', () => {
    const msgs = [user('hi'), toolResult('small')];
    const { messages, capped } = capOversizedToolResults(msgs, 1000);
    expect(capped).toBe(false);
    expect(messages).toBe(msgs);
  });

  it('clips toolResult bodies over maxChars', () => {
    const big = 'HEAD' + 'z'.repeat(5000) + 'TAIL';
    const msgs = [user('q'), assistant('call'), toolResult(big)];
    const { messages, capped } = capOversizedToolResults(msgs, 200);
    expect(capped).toBe(true);
    expect(messages).not.toBe(msgs);
    const text = String(
      Array.isArray(messages[2].content)
        ? (messages[2].content as Array<{ text?: string }>)[0]?.text
        : messages[2].content,
    );
    expect(text.length).toBeLessThanOrEqual(200);
    expect(text).toContain('truncated');
    expect(text.startsWith('HEAD')).toBe(true);
    expect(text.endsWith('TAIL')).toBe(true);
  });
});

describe('getMaxToolResultChars', () => {
  it('defaults to 120000 when unset', () => {
    expect(getMaxToolResultChars({})).toBe(120_000);
  });

  it('prefers AGENT_MAX_TOOL_RESULT_CHARS over RAG_EVIDENCE_MAX_CHARS', () => {
    expect(
      getMaxToolResultChars({
        AGENT_MAX_TOOL_RESULT_CHARS: '50000',
        RAG_EVIDENCE_MAX_CHARS: '90000',
      }),
    ).toBe(50_000);
  });

  it('treats 0 as unlimited (no fallback to 120000)', () => {
    expect(getMaxToolResultChars({ RAG_EVIDENCE_MAX_CHARS: '0' })).toBe(0);
    expect(getMaxToolResultChars({ AGENT_MAX_TOOL_RESULT_CHARS: '0' })).toBe(0);
  });
});

describe('applyMidRunContextGuard', () => {
  it('caps tool results even when under compaction threshold', async () => {
    const big = 'x'.repeat(10_000);
    const messages = [user('q'), assistant('t'), toolResult(big)];
    const result = await applyMidRunContextGuard({
      messages,
      settings: defaultSettings({ maxTokens: 1_000_000 }),
      maxToolResultChars: 500,
    });
    expect(result.toolResultsCapped).toBe(true);
    expect(result.compacted).toBe(false);
    expect(result.changed).toBe(true);
    expect(result.tokensAfter).toBeLessThan(result.tokensBefore);
  });

  it('compacts with local summary when over maxTokens', async () => {
    const messages = [
      user(padTokens(8_000)),
      assistant(padTokens(8_000)),
      user(padTokens(8_000)),
      assistant(padTokens(8_000)),
      user('latest'),
      assistant('answer'),
    ];
    const result = await applyMidRunContextGuard({
      messages,
      settings: defaultSettings({
        maxTokens: 100,
        compressToTokens: 50,
        minKeepRatio: 0.5,
      }),
      maxToolResultChars: 50_000,
    });
    expect(result.changed).toBe(true);
    expect(result.compacted).toBe(true);
    expect(result.messages[0].role).toBe('compactionSummary');
    expect(result.messages[0]._compaction).toBe(true);
    expect(String(result.messages[0].summary || result.messages[0].content)).toContain(
      '[user]',
    );
    expect(result.hardDrop).toBe(false);
    expect(result.shouldCompress).toBe(true);
    expect(result.diagnostics.droppedMessageCount).toBeGreaterThan(0);
  });

  it('always returns diagnostics even when nothing changed', async () => {
    const messages = [user('hi'), assistant('hello')];
    const result = await applyMidRunContextGuard({
      messages,
      settings: defaultSettings({ maxTokens: 1_000_000 }),
      maxToolResultChars: 50_000,
    });
    expect(result.changed).toBe(false);
    expect(result.compacted).toBe(false);
    expect(result.shouldCompress).toBe(false);
    expect(result.diagnostics.messageCountBefore).toBe(2);
    expect(result.diagnostics.rolesBefore.user).toBe(1);
    expect(result.diagnostics.toolCapDetails).toEqual([]);
    const line = formatContextManageLog(result, {
      conversationId: 'c1',
      label: 'pre-llm#1',
    });
    expect(line).toContain('context-manage conv=c1 pre-llm#1');
    expect(line).toContain('compaction=no (under maxTokens)');
    expect(line).toContain('toolResultCap=none');
    expect(line).toContain('changed=false');
  });
});
