import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  IMAGE_AGENT_SYSTEM_PROMPT,
  IMAGE_AGENT_TOOLS,
  buildImageAgentSystemPrompt,
} from './imageAgentSystemPrompt';

const grillingPath = path.join(process.cwd(), 'data/skills/grilling.md');

describe('IMAGE_AGENT_SYSTEM_PROMPT', () => {
  it('describes Agent Image and when not to generate or grill', () => {
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Agent Image/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/ComfyUI/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/hello/i);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/what can you do/i);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Do not grill/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Do not call any tool/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Only call generate_image/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/too vague/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/workflow JSON/);
    expect(IMAGE_AGENT_TOOLS).toEqual(['generate_image']);
  });

  it('caps grilling at two to three rounds and then generates', () => {
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/at most 2 rounds/i);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/3rd round/i);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(
      /complete, detailed image prompt/,
    );
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/just generate/i);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(
      /subject, style, composition, aspect ratio/,
    );
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(
      /Do not apply grilling to any other agent or task/,
    );
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(
      /Do not dispatch filesystem fact-finding sub-agents/,
    );
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Do not interview endlessly/);
  });

  it('includes the checked-in grilling skill format', () => {
    const skill = readFileSync(grillingPath, 'utf8');
    expect(skill).toMatch(/design tree/);
    expect(skill).toMatch(/frontier/);
    expect(skill).toMatch(/❓ \*\*Q1\*\*/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toContain(skill.trim());
  });

  it('still composes constraints plus the skill when files are passed in', () => {
    const prompt = buildImageAgentSystemPrompt(
      'Do not grill on hello.',
      'Ask the frontier in one round.',
    );
    expect(prompt).toMatch(/Do not grill on hello/);
    expect(prompt).toMatch(/Ask the frontier in one round/);
  });
});
