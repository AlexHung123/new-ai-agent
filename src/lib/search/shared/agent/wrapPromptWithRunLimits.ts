import type { ChatImageAttachment } from '@/lib/chat/attachedImages';
import {
  AgentRunToolGuard,
  getAgentRunLimitsConfig,
  type AgentRunLimitsConfig,
} from './agentRunLimits';

type NextTurnUpdate = {
  context?: {
    systemPrompt?: string;
    messages?: unknown[];
    tools?: unknown[];
  };
};

export type RunLimitedAgent = {
  prompt: (input: string, images?: ChatImageAttachment[]) => Promise<void>;
  abort: () => void;
  state?: {
    systemPrompt?: string;
    messages?: unknown[];
    tools?: unknown[];
  };
  prepareNextTurn?: (
    signal?: AbortSignal,
  ) => Promise<NextTurnUpdate | undefined> | NextTurnUpdate | undefined;
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

  agent.prompt = async (input: string, images?: ChatImageAttachment[]) => {
    const guard = new AgentRunToolGuard(cfg);
    const prevBefore = agent.beforeToolCall;
    const prevAfter = agent.afterToolCall;
    const prevPrepare = agent.prepareNextTurn;

    agent.prepareNextTurn = async (signal) => {
      const extra = await prevPrepare?.(signal);
      if (!guard.stripTools || !agent.state) return extra;
      return {
        ...(extra ?? {}),
        context: {
          systemPrompt:
            extra?.context?.systemPrompt ?? agent.state.systemPrompt,
          messages: extra?.context?.messages ?? agent.state.messages?.slice(),
          tools: [],
        },
      };
    };

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
      await originalPrompt(input, images);
    } finally {
      unsubscribe();
      agent.beforeToolCall = prevBefore;
      agent.afterToolCall = prevAfter;
      agent.prepareNextTurn = prevPrepare;
    }
  };

  return agent;
}
