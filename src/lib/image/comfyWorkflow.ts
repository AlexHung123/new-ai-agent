import { readFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';

export const USER_PROMPT_NODE_ID = '23:24';
export const KSAMPLER_NODE_ID = '23:7';
export const SAVE_IMAGE_NODE_ID = '9';

export const EMPTY_PROMPT_ERROR = 'Enter a prompt to generate an image.';

export type ComfyNode = {
  inputs?: Record<string, unknown>;
  class_type?: string;
  _meta?: { title?: string };
  [key: string]: unknown;
};

export type ComfyWorkflow = Record<string, ComfyNode>;

export function validateImagePrompt(
  prompt: unknown,
): { ok: true; prompt: string } | { ok: false; error: string } {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return { ok: false, error: EMPTY_PROMPT_ERROR };
  }
  return { ok: true, prompt: prompt.trim() };
}

export function randomKSamplerSeed(): number {
  // Template seeds are larger than 2^32; stay within a safe 48-bit range.
  return randomInt(0, 2 ** 48 - 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseComfyWorkflow(value: unknown): ComfyWorkflow {
  if (!isRecord(value)) {
    throw new Error('ComfyUI workflow must be a JSON object.');
  }
  const promptNode = value[USER_PROMPT_NODE_ID];
  const samplerNode = value[KSAMPLER_NODE_ID];
  const saveNode = value[SAVE_IMAGE_NODE_ID];
  if (!isRecord(promptNode) || !isRecord(promptNode.inputs)) {
    throw new Error(
      `ComfyUI workflow is missing prompt node ${USER_PROMPT_NODE_ID}.`,
    );
  }
  if (!isRecord(samplerNode) || !isRecord(samplerNode.inputs)) {
    throw new Error(
      `ComfyUI workflow is missing KSampler node ${KSAMPLER_NODE_ID}.`,
    );
  }
  if (!isRecord(saveNode)) {
    throw new Error(
      `ComfyUI workflow is missing SaveImage node ${SAVE_IMAGE_NODE_ID}.`,
    );
  }
  return value as ComfyWorkflow;
}

export function loadComfyWorkflow(filePath: string): ComfyWorkflow {
  const raw = readFileSync(filePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('ComfyUI workflow file is not valid JSON.');
  }
  return parseComfyWorkflow(parsed);
}

export function injectWorkflowInputs(
  template: ComfyWorkflow,
  input: { prompt: string; seed: number },
): ComfyWorkflow {
  const workflow = structuredClone(template);
  const promptNode = workflow[USER_PROMPT_NODE_ID];
  const samplerNode = workflow[KSAMPLER_NODE_ID];
  if (!promptNode?.inputs || !samplerNode?.inputs) {
    throw new Error('ComfyUI workflow is missing required nodes.');
  }
  promptNode.inputs.value = input.prompt;
  samplerNode.inputs.seed = input.seed;
  return workflow;
}

export function buildPromptWorkflow(
  template: ComfyWorkflow,
  prompt: unknown,
  seed?: number,
):
  | { ok: true; workflow: ComfyWorkflow; prompt: string; seed: number }
  | { ok: false; error: string } {
  const valid = validateImagePrompt(prompt);
  if (!valid.ok) return valid;
  const nextSeed = seed ?? randomKSamplerSeed();
  return {
    ok: true,
    workflow: injectWorkflowInputs(template, {
      prompt: valid.prompt,
      seed: nextSeed,
    }),
    prompt: valid.prompt,
    seed: nextSeed,
  };
}
