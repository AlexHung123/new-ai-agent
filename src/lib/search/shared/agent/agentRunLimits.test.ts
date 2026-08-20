import { describe, expect, it } from 'vitest';
import {
  AgentRunToolGuard,
  getAgentRunLimitsConfig,
  toolCallFingerprint,
  type AgentRunLimitsConfig,
} from './agentRunLimits';

const tight: AgentRunLimitsConfig = {
  maxToolCalls: 3,
  maxToolFailures: 2,
  maxTurns: 5,
};

describe('getAgentRunLimitsConfig', () => {
  it('defaults maxToolCalls to 30', () => {
    expect(getAgentRunLimitsConfig({}).maxToolCalls).toBe(30);
  });

  it('reads AGENT_MAX_TOOL_CALLS', () => {
    expect(
      getAgentRunLimitsConfig({ AGENT_MAX_TOOL_CALLS: '12' }).maxToolCalls,
    ).toBe(12);
  });
});

describe('toolCallFingerprint', () => {
  it('is stable across key order', () => {
    const a = toolCallFingerprint('keyword_search', { b: 1, a: 2 });
    const b = toolCallFingerprint('keyword_search', { a: 2, b: 1 });
    expect(a).toBe(b);
  });

  it('differs when args differ', () => {
    const a = toolCallFingerprint('keyword_search', { query: 'Amy' });
    const b = toolCallFingerprint('keyword_search', { query: '阿里巴巴' });
    expect(a).not.toBe(b);
  });
});

describe('AgentRunToolGuard', () => {
  it('allows up to maxToolCalls then blocks', () => {
    const g = new AgentRunToolGuard(tight);
    expect(g.beforeToolCall('fs_read', { q: 1 }).allow).toBe(true);
    expect(g.beforeToolCall('fs_read', { q: 2 }).allow).toBe(true);
    expect(g.beforeToolCall('fs_read', { q: 3 }).allow).toBe(true);
    const blocked = g.beforeToolCall('fs_read', { q: 4 });
    expect(blocked.allow).toBe(false);
    if (!blocked.allow) {
      expect(blocked.reason).toMatch(/Tool call limit/i);
      expect(blocked.reason).toMatch(/3 max/);
    }
  });

  it('blocks same tool+args after max consecutive failures', () => {
    const g = new AgentRunToolGuard(tight);
    const args = { query: 'Amy' };
    expect(g.beforeToolCall('keyword_search', args).allow).toBe(true);
    g.afterToolCall('keyword_search', args, true);
    expect(g.beforeToolCall('keyword_search', args).allow).toBe(true);
    g.afterToolCall('keyword_search', args, true);
    const blocked = g.beforeToolCall('keyword_search', args);
    expect(blocked.allow).toBe(false);
    if (!blocked.allow) {
      expect(blocked.reason).toMatch(/failed/i);
    }
  });

  it('resets failure count on success', () => {
    const g = new AgentRunToolGuard({
      maxToolCalls: 10,
      maxToolFailures: 2,
      maxTurns: 10,
    });
    const args = { query: 'x' };
    expect(g.beforeToolCall('keyword_search', args).allow).toBe(true);
    g.afterToolCall('keyword_search', args, true);
    expect(g.beforeToolCall('keyword_search', args).allow).toBe(true);
    g.afterToolCall('keyword_search', args, false);
    expect(g.beforeToolCall('keyword_search', args).allow).toBe(true);
    g.afterToolCall('keyword_search', args, true);
    expect(g.beforeToolCall('keyword_search', args).allow).toBe(true);
  });

  it('allows different args after failures on another fingerprint', () => {
    const g = new AgentRunToolGuard(tight);
    const a = { query: 'Amy' };
    const b = { query: 'Alibaba' };
    expect(g.beforeToolCall('keyword_search', a).allow).toBe(true);
    g.afterToolCall('keyword_search', a, true);
    expect(g.beforeToolCall('keyword_search', a).allow).toBe(true);
    g.afterToolCall('keyword_search', a, true);
    expect(g.beforeToolCall('keyword_search', a).allow).toBe(false);
    expect(g.beforeToolCall('keyword_search', b).allow).toBe(true);
  });

  it('hard-stops after max turns', () => {
    const g = new AgentRunToolGuard({
      maxToolCalls: 50,
      maxToolFailures: 5,
      maxTurns: 2,
    });
    expect(g.onTurnStart()).toBe(false);
    expect(g.onTurnStart()).toBe(false);
    expect(g.onTurnStart()).toBe(true);
    expect(g.shouldHardStop).toBe(true);
  });

  it('hard-stops after repeated blocks past tool limit', () => {
    const g = new AgentRunToolGuard({
      maxToolCalls: 1,
      maxToolFailures: 5,
      maxTurns: 20,
    });
    expect(g.beforeToolCall('t', {}).allow).toBe(true);
    expect(g.beforeToolCall('t', {}).allow).toBe(false);
    expect(g.shouldHardStop).toBe(false);
    expect(g.beforeToolCall('t', {}).allow).toBe(false);
    expect(g.shouldHardStop).toBe(true);
  });
});
