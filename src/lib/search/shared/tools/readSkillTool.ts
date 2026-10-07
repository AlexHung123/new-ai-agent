import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import {
  formatLoadedSkill,
  listAgentSkills,
  readAgentSkill,
} from '@/lib/skills/registry';
import { jsonToolResult } from '../runtime/piToolResult';

export function createReadSkillTool(): AgentTool {
  return {
    name: 'read_skill',
    label: 'Read skill',
    description:
      'Load skill instructions by name from available_skills. Call this before am_render when the user asked for a visual explainer page.',
    parameters: Type.Object({
      name: Type.String({
        description:
          'Skill name from available_skills, for example html-explainer',
      }),
    }),
    execute: async (_id, args) => {
      const name =
        args && typeof args === 'object' && typeof (args as { name?: unknown }).name === 'string'
          ? (args as { name: string }).name.trim()
          : '';
      const skill = name ? readAgentSkill(name) : null;
      if (!skill) {
        return jsonToolResult({
          ok: false,
          error: `Unknown skill: ${name || '(empty)'}`,
          available: listAgentSkills().map((s) => s.name),
        });
      }
      return jsonToolResult({
        ok: true,
        name: skill.name,
        content: formatLoadedSkill(skill),
      });
    },
  };
}
