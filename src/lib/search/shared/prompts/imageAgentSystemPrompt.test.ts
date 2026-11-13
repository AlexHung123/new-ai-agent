import { describe, expect, it } from 'vitest';
import {
  IMAGE_AGENT_SYSTEM_PROMPT,
  IMAGE_AGENT_TOOLS,
} from './imageAgentSystemPrompt';

describe('IMAGE_AGENT_SYSTEM_PROMPT', () => {
  it('describes Agent Image and when not to generate', () => {
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Agent Image/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/ComfyUI/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/hello/i);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/what can you do/i);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Do not call any tool/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/Only call generate_image/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/too vague/);
    expect(IMAGE_AGENT_SYSTEM_PROMPT).toMatch(/workflow JSON/);
    expect(IMAGE_AGENT_TOOLS).toEqual(['generate_image']);
  });
});
