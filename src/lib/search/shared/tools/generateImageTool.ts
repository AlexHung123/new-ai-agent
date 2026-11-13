import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import { runComfyImageJob } from '@/lib/image/runComfyImageJob';
import { jsonToolResult } from '../runtime/piToolResult';
import { getImageAgentTurnContext } from '../runtime/imageAgentTurnContext';

export const GENERATE_IMAGE_TOOL_NAME = 'generate_image';

export const GENERATE_IMAGE_TOOL_DESCRIPTION =
  'Generate an image with ComfyUI from a text prompt. Use this only when the user clearly wants an image created, drawn, or generated. Never call this tool for greetings, capability questions, or chitchat such as "hello" or "what can you do". If the request is too vague, ask a clarifying question instead of calling this tool.';

export function createGenerateImageTool(): AgentTool {
  return {
    name: GENERATE_IMAGE_TOOL_NAME,
    label: 'Generate image',
    description: GENERATE_IMAGE_TOOL_DESCRIPTION,
    parameters: Type.Object({
      prompt: Type.String({
        description:
          'The full image prompt to send to ComfyUI. Required. Do not pass greetings or capability questions.',
      }),
    }),
    execute: async (_id, args) => {
      const ctx = getImageAgentTurnContext();
      if (!ctx) {
        return jsonToolResult({
          ok: false,
          error: 'No image generation turn is bound for this request.',
        });
      }
      const prompt =
        args &&
        typeof args === 'object' &&
        typeof (args as { prompt?: unknown }).prompt === 'string'
          ? (args as { prompt: string }).prompt
          : '';
      const result = await runComfyImageJob({
        prompt,
        userId: ctx.userId,
        signal: ctx.signal,
        emit: ctx.emitImage,
      });
      if (!result.ok) {
        return jsonToolResult({
          ok: false,
          error: result.error,
        });
      }
      return jsonToolResult({
        ok: true,
        jobId: result.jobId,
        seed: result.seed,
        imageUrl: result.imageUrl,
        instruction:
          'The image is on the canvas. Confirm in one short line. Do not dump the workflow JSON, seed, or tool details.',
      });
    },
  };
}
