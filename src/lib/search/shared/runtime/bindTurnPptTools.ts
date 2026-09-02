import type { NamedTool, PooledAgent } from '../agent/piAgentSessionManager';
import { PPT_TOOL_NAMES } from '@/lib/ppt/stage';
import {
  runWithPptTurn,
  type PptTurnContext,
} from '@/lib/ppt/pptTurnContext';

const PPT_TOOLS = new Set<string>(PPT_TOOL_NAMES);

type ExecutableTool = NamedTool & {
  execute?: (...args: unknown[]) => unknown;
};

function wrapPptTool(tool: NamedTool, turn: PptTurnContext): NamedTool {
  const executable = tool as ExecutableTool;
  const original = executable.execute;
  if (typeof original !== 'function' || !PPT_TOOLS.has(tool.name)) {
    return tool;
  }
  return {
    ...executable,
    execute: (...args: unknown[]) =>
      runWithPptTurn(turn, () => original.apply(executable, args)),
  } as NamedTool;
}

export function bindTurnPptTools(
  agent: PooledAgent,
  turn: PptTurnContext,
): () => void {
  const original = agent.state.tools;
  agent.state.tools = original.map((tool) => wrapPptTool(tool, turn));
  return () => {
    agent.state.tools = original;
  };
}
