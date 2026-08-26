import type { NamedTool, PooledAgent } from '../agent/piAgentSessionManager';
import { writingFsReadOverlay } from '../tools/fs/fsTools';
import {
  runWithDocumentTurn,
  type DocumentTurnContext,
} from './documentTurnContext';
import {
  runWithWritingTurn,
  type WritingTurnContext,
} from './writingTurnContext';

const FS_TOOL_NAMES = new Set(['fs_ls', 'fs_read', 'fs_grep', 'fs_find']);

export type TurnFsBinding = {
  writing?: WritingTurnContext;
  document?: DocumentTurnContext;
};

type ExecutableTool = NamedTool & {
  execute?: (...args: unknown[]) => unknown;
};

function wrapFsTool(tool: NamedTool, turn: TurnFsBinding): NamedTool {
  const executable = tool as ExecutableTool;
  const original = executable.execute;
  if (typeof original !== 'function' || !FS_TOOL_NAMES.has(tool.name)) {
    return tool;
  }

  return {
    ...executable,
    ...(turn.writing && tool.name === 'fs_read' ? writingFsReadOverlay() : {}),
    execute: (...args: unknown[]) => {
      const invoke = () => original.apply(executable, args);
      if (turn.writing) return runWithWritingTurn(turn.writing, invoke);
      if (turn.document) return runWithDocumentTurn(turn.document, invoke);
      return invoke();
    },
  } as NamedTool;
}

/**
 * Re-enter writing/document ALS for fs_* execute after LLM fetch drops it.
 * Capture the turn before any await, then bind on the agent used for prompt().
 */
export function bindTurnFsTools(
  agent: PooledAgent,
  turn: TurnFsBinding,
): () => void {
  if (!turn.writing && !turn.document) return () => undefined;
  const original = agent.state.tools;
  agent.state.tools = original.map((tool) => wrapFsTool(tool, turn));
  return () => {
    agent.state.tools = original;
  };
}
