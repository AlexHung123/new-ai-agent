import type { NamedTool, PooledAgent } from '@/lib/search/shared/agent/piAgentSessionManager';
import { createAmRenderTool } from '@/lib/search/shared/tools/amRenderTool';
import { createReadSkillTool } from '@/lib/search/shared/tools/readSkillTool';
import { stripHtmlTurnPrefixesFromMessages } from './htmlSkill';
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

/** Always bind read_skill and am_render. Always strip leftover user prefixes. */
export function bindTurnHtmlTool(agent: PooledAgent): () => void {
  const originalTools = agent.state.tools;
  const originalPrompt = agent.state.systemPrompt;
  const without = originalTools.filter(
    (tool) => tool.name !== 'am_render' && tool.name !== 'read_skill',
  );
  const foundRender = originalTools.find((tool) => tool.name === 'am_render');
  const foundRead = originalTools.find((tool) => tool.name === 'read_skill');
  const renderTool = wrapHtmlTool(foundRender ?? createAmRenderTool());
  const readTool = foundRead ?? createReadSkillTool();

  agent.state.tools = [...without, readTool, renderTool];
  agent.state.messages = stripHtmlTurnPrefixesFromMessages(
    agent.state.messages ?? [],
  );

  return () => {
    agent.state.tools = originalTools;
    agent.state.systemPrompt = originalPrompt;
  };
}
