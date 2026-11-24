import type { NamedTool, PooledAgent } from '../agent/piAgentSessionManager';
import {
  runWithWritingTurn,
  type WritingTurnContext,
} from './writingTurnContext';

const DOCHUB_TOOL_NAMES = new Set(['search', 'read']);

type ExecutableTool = NamedTool & {
  execute?: (...args: unknown[]) => unknown;
};

function wrapDochubTool(tool: NamedTool, ctx: WritingTurnContext): NamedTool {
  const executable = tool as ExecutableTool;
  const original = executable.execute;
  if (typeof original !== 'function' || !DOCHUB_TOOL_NAMES.has(tool.name)) {
    return tool;
  }

  return {
    ...executable,
    execute: (...args: unknown[]) => {
      const invoke = () => original.apply(executable, args);
      return runWithWritingTurn(ctx, invoke);
    },
  } as NamedTool;
}

/**
 * Re-enter writing ALS for Dochub execute after LLM fetch drops it.
 * Capture the turn before any await, then bind on the agent used for prompt().
 */
export function bindTurnDochubTools(
  agent: PooledAgent,
  ctx: WritingTurnContext,
): () => void {
  const original = agent.state.tools;
  agent.state.tools = original.map((tool) => wrapDochubTool(tool, ctx));
  return () => {
    agent.state.tools = original;
  };
}
