import type { TranscriptAgentMessage } from './agentTranscriptCodec';
import { applyTranscriptCheckpoints } from './agentTranscriptCheckpoint';
import {
  applyMidRunContextGuard,
  getAgentCompactionSettings,
  getMaxToolResultChars,
  type AgentCompactionSettings,
  type CompactableMessage,
  type MidRunGuardResult,
} from '../agent/agentCompaction';

/**
 * Prefer durable transcript; else map UI history to user/assistant stubs.
 */
export function resolveHydrateMessages(args: {
  transcript: TranscriptAgentMessage[];
  uiHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  modelId: string;
}): TranscriptAgentMessage[] {
  if (args.transcript.length > 0) {
    return applyTranscriptCheckpoints(args.transcript);
  }

  return args.uiHistory.map((m) => {
    if (m.role === 'user') {
      return {
        role: 'user' as const,
        content: m.content,
        timestamp: Date.now(),
      };
    }
    return {
      role: 'assistant' as const,
      content: [{ type: 'text' as const, text: m.content }],
      api: 'openai-completions' as const,
      provider: 'local-openai',
      model: args.modelId,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: 'stop' as const,
      timestamp: Date.now(),
    };
  });
}

export type GuardedHydrateResult = {
  messages: TranscriptAgentMessage[];
  guard: MidRunGuardResult;
};

/**
 * Resolve hydrate source, then run the same mid-run context guard so a cold
 * pool miss never constructs an Agent on an over-budget transcript.
 */
export async function resolveAndGuardHydrateMessages(args: {
  transcript: TranscriptAgentMessage[];
  uiHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  modelId: string;
  settings?: AgentCompactionSettings;
  maxToolResultChars?: number;
}): Promise<GuardedHydrateResult> {
  const resolved = resolveHydrateMessages({
    transcript: args.transcript,
    uiHistory: args.uiHistory,
    modelId: args.modelId,
  });
  const guard = await applyMidRunContextGuard({
    messages: resolved as CompactableMessage[],
    settings: args.settings ?? getAgentCompactionSettings(),
    maxToolResultChars: args.maxToolResultChars ?? getMaxToolResultChars(),
  });
  return {
    messages: guard.messages as TranscriptAgentMessage[],
    guard,
  };
}
