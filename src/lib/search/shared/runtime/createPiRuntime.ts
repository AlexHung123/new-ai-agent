import { Agent } from '@earendil-works/pi-agent-core';
import {
  applyMidRunContextGuard,
  formatContextManageLog,
  getAgentCompactionSettings,
  type CompactableMessage,
} from '../agent/agentCompaction';
import { convertAgentMessagesToLlm } from '../agent/agentConvertToLlm';
import { getAgentModelConfig } from '../config/ragflowConfig';
import { getContextBudget } from '../agent/contextBudget';
import { compactionCheckpointFromGuard } from './agentTranscriptCheckpoint';
import {
  createPiModelBundle,
  type PiModelBundle,
} from './piModel';
import type {
  AgentRuntimeExtras,
  CreatePooledAgentOptions,
  NamedTool,
  PiTemplate,
  PooledAgent,
} from '../agent/piAgentSessionManager';

export type PiRuntime = {
  bundle: PiModelBundle;
  templates: Record<string, PiTemplate>;
  tools: Record<string, NamedTool>;
  createAgent: (opts: CreatePooledAgentOptions) => PooledAgent;
};

export function createPiRuntime(options: {
  templates: Record<string, PiTemplate>;
  tools: Record<string, NamedTool>;
}): PiRuntime {
  const bundle = createPiModelBundle(getAgentModelConfig());

  const createAgent = (opts: CreatePooledAgentOptions): PooledAgent => {
    const agent = new Agent({
      initialState: {
        systemPrompt: opts.systemPrompt,
        model: bundle.model as never,
        thinkingLevel: 'off',
        tools: opts.tools as never,
        messages: (opts.messages ?? []) as never,
      },
      streamFn: bundle.streamSimple as never,
      getApiKey: () => bundle.getApiKey(),
      sessionId: opts.sessionId,
      toolExecution: 'sequential',
      convertToLlm: (msgs) =>
        convertAgentMessagesToLlm(Array.isArray(msgs) ? msgs : []) as never,
    }) as unknown as AgentRuntimeExtras;

    let llmCallSeq = 0;
    agent.transformContext = async (msgs, _signal) => {
      const settings = getAgentCompactionSettings();
      const budget = getContextBudget();
      const callN = ++llmCallSeq;
      try {
        const result = await applyMidRunContextGuard({
          messages: (msgs || []) as CompactableMessage[],
          settings,
          maxToolResultChars: budget.toolResultMaxChars,
        });
        console.log(
          formatContextManageLog(result, {
            conversationId: opts.sessionId,
            label: `pre-llm#${callN}`,
          }),
        );
        if (result.changed) {
          agent.state.messages = result.messages as typeof agent.state.messages;
        }
        if (result.compacted) {
          const cp = compactionCheckpointFromGuard(result);
          if (cp) {
            agent.__pendingCheckpoint = cp;
            agent.__compactedViewLength = result.messages.length;
          }
        }
        return result.messages as CompactableMessage[];
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `context-manage conv=${opts.sessionId} pre-llm#${callN} skipped: ${message}`,
        );
        return msgs as CompactableMessage[];
      }
    };

    return agent;
  };

  return {
    bundle,
    templates: options.templates,
    tools: options.tools,
    createAgent,
  };
}
