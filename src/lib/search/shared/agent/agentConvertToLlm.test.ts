import { describe, expect, it } from 'vitest';
import {
  COMPACTION_SUMMARY_PREFIX,
  COMPACTION_SUMMARY_SUFFIX,
  buildSummaryUserMessage,
} from './agentCompaction';
import {
  COMPACTION_LLM_LEAD_IN,
  convertAgentMessagesToLlm,
  extractCompactionSummaryBody,
  formatCompactionSummaryForLlm,
  isCompactionAgentMessage,
  unwrapCompactionWrappers,
} from './agentConvertToLlm';

describe('isCompactionAgentMessage', () => {
  it('detects compactionSummary and _compaction flag', () => {
    expect(
      isCompactionAgentMessage({ role: 'compactionSummary', summary: 'x' }),
    ).toBe(true);
    expect(
      isCompactionAgentMessage({
        role: 'user',
        content: 'hi',
        _compaction: true,
      }),
    ).toBe(true);
    expect(isCompactionAgentMessage({ role: 'user', content: 'hi' })).toBe(
      false,
    );
  });

  it('detects legacy wrapped user content', () => {
    const content =
      COMPACTION_SUMMARY_PREFIX + 'old turns' + COMPACTION_SUMMARY_SUFFIX;
    expect(isCompactionAgentMessage({ role: 'user', content })).toBe(true);
  });
});

describe('unwrap / format', () => {
  it('unwraps nested wrappers', () => {
    const wrapped =
      COMPACTION_SUMMARY_PREFIX + 'body text' + COMPACTION_SUMMARY_SUFFIX;
    expect(unwrapCompactionWrappers(wrapped)).toBe('body text');
    expect(
      unwrapCompactionWrappers(
        COMPACTION_LLM_LEAD_IN + '\n\n' + wrapped,
      ),
    ).toBe('body text');
  });

  it('formats with lead-in and tags', () => {
    const text = formatCompactionSummaryForLlm('facts about policy');
    expect(text.startsWith(COMPACTION_LLM_LEAD_IN)).toBe(true);
    expect(text).toContain('<context-summary>');
    expect(text).toContain('facts about policy');
    expect(text).not.toContain(COMPACTION_LLM_LEAD_IN + COMPACTION_LLM_LEAD_IN);
  });
});

describe('convertAgentMessagesToLlm', () => {
  it('maps compactionSummary to labeled user background message', () => {
    const node = buildSummaryUserMessage('dropped history', 12_000);
    const llm = convertAgentMessagesToLlm([
      node,
      { role: 'user', content: 'what is the policy?' },
    ]);
    expect(llm).toHaveLength(2);
    expect(llm[0]?.role).toBe('user');
    expect(String(llm[0]?.content)).toContain(COMPACTION_LLM_LEAD_IN);
    expect(String(llm[0]?.content)).toContain('dropped history');
    expect(String(llm[0]?.content)).toContain('NOT a new user request');
    expect(llm[1]).toEqual({ role: 'user', content: 'what is the policy?' });
  });

  it('normalizes legacy _compaction user messages', () => {
    const legacy = {
      role: 'user' as const,
      content:
        COMPACTION_SUMMARY_PREFIX + 'legacy body' + COMPACTION_SUMMARY_SUFFIX,
      _compaction: true,
    };
    const llm = convertAgentMessagesToLlm([legacy]);
    expect(llm).toHaveLength(1);
    expect(extractCompactionSummaryBody(legacy)).toBe('legacy body');
    expect(String(llm[0]?.content)).toContain(COMPACTION_LLM_LEAD_IN);
    expect(String(llm[0]?.content)).toContain('legacy body');
    // Single wrap only
    expect(String(llm[0]?.content).split('<context-summary>').length - 1).toBe(
      1,
    );
  });

  it('passes through assistant and toolResult unchanged', () => {
    const assistant = {
      role: 'assistant' as const,
      content: [{ type: 'text', text: 'ok' }],
      stopReason: 'stop',
    };
    const tool = {
      role: 'toolResult' as const,
      toolCallId: 'c1',
      toolName: 'retrieve_chunks',
      content: [{ type: 'text', text: 'hit' }],
    };
    const llm = convertAgentMessagesToLlm([assistant, tool]);
    expect(llm[0]).toBe(assistant);
    expect(llm[1]).toBe(tool);
  });

  it('drops empty compaction and unknown roles', () => {
    const llm = convertAgentMessagesToLlm([
      { role: 'compactionSummary', summary: '   ' },
      { role: 'notification', text: 'ui only' },
      { role: 'user', content: 'real' },
    ]);
    expect(llm).toEqual([{ role: 'user', content: 'real' }]);
  });

  it('does not treat normal user as compaction', () => {
    const llm = convertAgentMessagesToLlm([
      { role: 'user', content: 'please summarize this document' },
      { role: 'assistant', content: [{ type: 'text', text: 'sure' }] },
    ]);
    expect(llm).toHaveLength(2);
    expect(String(llm[0]?.content)).toBe('please summarize this document');
    expect(String(llm[0]?.content)).not.toContain(COMPACTION_LLM_LEAD_IN);
  });
});
