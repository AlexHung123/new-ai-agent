import {
  AgentRunToolGuard,
  getAgentRunLimitsConfig,
  type AgentRunLimitsConfig,
} from './agentRunLimits';

export type RunLimitedAgent = {
  prompt: (input: string) => Promise<void>;
  abort: () => void;
  subscribe: (
    listener: (event: { type?: string }) => void | Promise<void>,
  ) => () => void;
  beforeToolCall?: (
    context: { toolCall?: { name?: string }; args?: unknown },
    signal?: AbortSignal,
  ) => Promise<{ block?: boolean; reason?: string } | undefined>;
  afterToolCall?: (
    context: {
      toolCall?: { name?: string };
      args?: unknown;
      isError?: boolean;
    },
    signal?: AbortSignal,
  ) => Promise<{ terminate?: boolean } | undefined>;
};

export function wrapPromptWithRunLimits<T extends RunLimitedAgent>(
  agent: T,
  cfg: AgentRunLimitsConfig = getAgentRunLimitsConfig(),
): T {
  const originalPrompt = agent.prompt.bind(agent);

  agent.prompt = async (input: string) => {
    const guard = new AgentRunToolGuard(cfg);
    const prevBefore = agent.beforeToolCall;
    const prevAfter = agent.afterToolCall;

    agent.beforeToolCall = async (ctx, signal) => {
      const name = String(ctx.toolCall?.name || 'tool');
      const decision = guard.beforeToolCall(name, ctx.args);
      if (!decision.allow) {
        console.warn(`tool blocked: ${decision.reason}`);
        if (guard.shouldHardStop) {
          try {
            agent.abort();
          } catch {
            /* ignore */
          }
        }
        return { block: true, reason: decision.reason };
      }
      return prevBefore?.(ctx, signal);
    };

    agent.afterToolCall = async (ctx, signal) => {
      const name = String(ctx.toolCall?.name || 'tool');
      guard.afterToolCall(name, ctx.args, Boolean(ctx.isError));
      const extra = await prevAfter?.(ctx, signal);
      if (guard.shouldHardStop) {
        return { ...(extra ?? {}), terminate: true };
      }
      return extra;
    };

    const unsubscribe = agent.subscribe((event) => {
      if (event?.type === 'turn_start' && guard.onTurnStart()) {
        try {
          agent.abort();
        } catch {
          /* ignore */
        }
      }
    });

    try {
      await originalPrompt(input);
    } finally {
      unsubscribe();
      agent.beforeToolCall = prevBefore;
      agent.afterToolCall = prevAfter;
    }
  };

  return agent;
}
