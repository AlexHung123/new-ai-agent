import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { WRITING_AGENT_SYSTEM_PROMPT } from './writingAgentSystemPrompt';

function readRepo(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), 'utf8');
}

describe('writing Dochub skill', () => {
  it('prepends the skill and drops fs_* document instructions', () => {
    expect(WRITING_AGENT_SYSTEM_PROMPT).toMatch(/query → get/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).toMatch(/Never pass `user_id`/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/fs_ls/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/INDEX\.md/);
    const skill = readRepo('data/prompts/dochubSkill.md');
    expect(skill).toMatch(/in-process/);
    expect(skill).not.toMatch(/python -m dochub mcp/);
    const writing = readRepo('data/prompts/agentWriting.md');
    expect(writing).not.toMatch(/fs_/);
  });
});
