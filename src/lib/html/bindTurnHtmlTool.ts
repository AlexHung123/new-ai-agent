import type { NamedTool, PooledAgent } from '@/lib/search/shared/agent/piAgentSessionManager';
import { createAmRenderTool } from '@/lib/search/shared/tools/amRenderTool';
import {
  stripHtmlTurnPrefixesFromMessages,
  withHtmlSkillSystemPrompt,
} from './htmlSkill';
import { getHtmlTurnContext, runWithHtmlTurn } from './htmlTurnContext';

type ExecutableTool = NamedTool & {
  execute?: (...args: unknown[]) => unknown;
};

function wrapHtmlTool(tool: NamedTool): NamedTool {
  const executable = tool as ExecutableTool;
  const original = executable.execute;
  const ctx = getHtmlTurnContext();
  if (typeof original !== 'function' || !ctx) return tool;
  return {
    ...executable,
    execute: (...args: unknown[]) =>
      runWithHtmlTurn(ctx, () => original.apply(executable, args)),
  } as NamedTool;
}

/** HTML tag on: skill + am_render. Off: neither, and strip leftover user prefixes. */
export function bindTurnHtmlTool(agent: PooledAgent): () => void {
  const originalTools = agent.state.tools;
  const originalPrompt = agent.state.systemPrompt;
  const htmlMode = getHtmlTurnContext()?.htmlMode === true;
  const without = originalTools.filter((tool) => tool.name !== 'am_render');

  if (!htmlMode) {
    agent.state.tools = without;
    agent.state.messages = stripHtmlTurnPrefixesFromMessages(
      agent.state.messages ?? [],
    );
    return () => {
      agent.state.tools = originalTools;
      agent.state.systemPrompt = originalPrompt;
    };
  }

  const found = originalTools.find((tool) => tool.name === 'am_render');
  const renderTool = wrapHtmlTool(found ?? createAmRenderTool());
  agent.state.tools = [...without, renderTool];
  agent.state.systemPrompt = withHtmlSkillSystemPrompt(originalPrompt);
  return () => {
    agent.state.tools = originalTools;
    agent.state.systemPrompt = originalPrompt;
  };
}
