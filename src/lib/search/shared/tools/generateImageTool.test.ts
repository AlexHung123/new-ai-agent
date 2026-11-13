import { describe, expect, it } from 'vitest';
import { EMPTY_PROMPT_ERROR } from '@/lib/image/comfyWorkflow';
import { runWithImageAgentTurn } from '../runtime/imageAgentTurnContext';
import {
  GENERATE_IMAGE_TOOL_DESCRIPTION,
  createGenerateImageTool,
} from './generateImageTool';

describe('generate_image tool', () => {
  it('tells the model not to generate for greetings or chitchat', () => {
    expect(GENERATE_IMAGE_TOOL_DESCRIPTION).toMatch(/greetings/i);
    expect(GENERATE_IMAGE_TOOL_DESCRIPTION).toMatch(/hello/i);
    expect(GENERATE_IMAGE_TOOL_DESCRIPTION).toMatch(/what can you do/i);
    expect(GENERATE_IMAGE_TOOL_DESCRIPTION).toMatch(
      /only when the user clearly wants an image/i,
    );
  });

  it('returns an error when no turn is bound', async () => {
    const tool = createGenerateImageTool();
    const result = await tool.execute('t1', { prompt: 'a fox' });
    expect(result.details).toMatchObject({
      ok: false,
      error: 'No image generation turn is bound for this request.',
    });
  });

  it('rejects an empty prompt without hanging', async () => {
    const tool = createGenerateImageTool();
    const result = await runWithImageAgentTurn({ userId: '7' }, () =>
      tool.execute('t1', { prompt: '  ' }),
    );
    expect(result.details).toMatchObject({
      ok: false,
      error: EMPTY_PROMPT_ERROR,
    });
  });
});
