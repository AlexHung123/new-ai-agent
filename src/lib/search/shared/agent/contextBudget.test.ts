import { describe, expect, it } from 'vitest';
import {
  formatContextBudgetSnapshot,
  getContextBudget,
} from './contextBudget';

describe('getContextBudget', () => {
  it('defaults match pi-rag compaction knobs', () => {
    const b = getContextBudget({});
    expect(b.scale).toBe(1);
    expect(b.toolResultMaxChars).toBe(120_000);
    expect(b.transcriptMaxChars).toBe(400_000);
    expect(b.compactionMaxTokens).toBe(50_000);
    expect(b.compactionCompressToTokens).toBe(30_000);
    expect(b.logEnabled).toBe(true);
  });

  it('CONTEXT_BUDGET_* overrides legacy keys', () => {
    const b = getContextBudget({
      AGENT_MAX_TOOL_RESULT_CHARS: '90000',
      CONTEXT_BUDGET_TOOL_CHARS: '30000',
      AGENT_TRANSCRIPT_MAX_CHARS: '100000',
      CONTEXT_BUDGET_TRANSCRIPT_CHARS: '80000',
      AGENT_COMPACTION_MAX_TOKENS: '80000',
      CONTEXT_BUDGET_COMPACTION_MAX_TOKENS: '60000',
      AGENT_COMPACTION_COMPRESS_TO_TOKENS: '20000',
      CONTEXT_BUDGET_COMPACTION_COMPRESS_TO: '15000',
    });
    expect(b.toolResultMaxChars).toBe(30_000);
    expect(b.transcriptMaxChars).toBe(80_000);
    expect(b.compactionMaxTokens).toBe(60_000);
    expect(b.compactionCompressToTokens).toBe(15_000);
  });

  it('CONTEXT_BUDGET_SCALE multiplies soft caps but keeps 0 unlimited', () => {
    const b = getContextBudget({
      CONTEXT_BUDGET_SCALE: '0.5',
      AGENT_MAX_TOOL_RESULT_CHARS: '0',
      AGENT_COMPACTION_MAX_TOKENS: '50000',
    });
    expect(b.scale).toBe(0.5);
    expect(b.toolResultMaxChars).toBe(0);
    expect(b.compactionMaxTokens).toBe(25_000);
  });

  it('tool cascade: AGENT_MAX then RAG_EVIDENCE then default', () => {
    expect(
      getContextBudget({ AGENT_MAX_TOOL_RESULT_CHARS: '11111' })
        .toolResultMaxChars,
    ).toBe(11_111);
    expect(
      getContextBudget({ RAG_EVIDENCE_MAX_CHARS: '22222' }).toolResultMaxChars,
    ).toBe(22_222);
    expect(getContextBudget({}).toolResultMaxChars).toBe(120_000);
  });

  it('formatContextBudgetSnapshot is a stable one-liner', () => {
    const s = formatContextBudgetSnapshot(getContextBudget({}));
    expect(s).toMatch(/^\[context-budget\]/);
    expect(s).toMatch(/toolChars=120000/);
    expect(s).toMatch(/compactMaxTokens=50000/);
    expect(s).toMatch(/compactToTokens=30000/);
  });
});
