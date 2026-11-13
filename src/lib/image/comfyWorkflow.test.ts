import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_PROMPT_ERROR,
  KSAMPLER_NODE_ID,
  USER_PROMPT_NODE_ID,
  buildPromptWorkflow,
  injectWorkflowInputs,
  loadComfyWorkflow,
  validateImagePrompt,
} from './comfyWorkflow';

const WORKFLOW_PATH = path.join(
  process.cwd(),
  'data/comfy/minimax_h3_t2i.json',
);

describe('validateImagePrompt', () => {
  it('rejects typo/empty prompts', () => {
    expect(validateImagePrompt('')).toEqual({
      ok: false,
      error: EMPTY_PROMPT_ERROR,
    });
    expect(validateImagePrompt('   \n\t')).toEqual({
      ok: false,
      error: EMPTY_PROMPT_ERROR,
    });
    expect(validateImagePrompt(null)).toEqual({
      ok: false,
      error: EMPTY_PROMPT_ERROR,
    });
    expect(validateImagePrompt(undefined)).toEqual({
      ok: false,
      error: EMPTY_PROMPT_ERROR,
    });
  });

  it('trims a real prompt', () => {
    expect(validateImagePrompt('  a red fox  ')).toEqual({
      ok: true,
      prompt: 'a red fox',
    });
  });
});

describe('workflow prompt and seed injection', () => {
  it('loads the checked-in template and injects a new prompt and seed', () => {
    const template = loadComfyWorkflow(WORKFLOW_PATH);
    const originalSeed = template[KSAMPLER_NODE_ID]?.inputs?.seed;
    const built = buildPromptWorkflow(
      template,
      '  a plush fox in a meadow  ',
      42,
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    expect(built.prompt).toBe('a plush fox in a meadow');
    expect(built.seed).toBe(42);
    expect(built.workflow[USER_PROMPT_NODE_ID]?.inputs?.value).toBe(
      'a plush fox in a meadow',
    );
    expect(built.workflow[KSAMPLER_NODE_ID]?.inputs?.seed).toBe(42);
    expect(template[USER_PROMPT_NODE_ID]?.inputs?.value).not.toBe(
      'a plush fox in a meadow',
    );
    expect(originalSeed).not.toBe(42);
    expect(template[KSAMPLER_NODE_ID]?.inputs?.seed).toBe(originalSeed);
  });

  it('randomizes the KSampler seed when none is provided', () => {
    const template = loadComfyWorkflow(WORKFLOW_PATH);
    const originalSeed = template[KSAMPLER_NODE_ID]?.inputs?.seed;
    const first = buildPromptWorkflow(template, 'first');
    const second = buildPromptWorkflow(template, 'second');
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.seed).not.toBe(originalSeed);
    expect(second.seed).not.toBe(originalSeed);
    expect(first.seed).not.toBe(second.seed);
  });

  it('does not mutate the template when injecting inputs', () => {
    const template = loadComfyWorkflow(WORKFLOW_PATH);
    const before = JSON.stringify(template);
    injectWorkflowInputs(template, { prompt: 'changed', seed: 7 });
    expect(JSON.stringify(template)).toBe(before);
  });

  it('refuses to build a workflow from an empty prompt', () => {
    const template = loadComfyWorkflow(WORKFLOW_PATH);
    expect(buildPromptWorkflow(template, ' ')).toEqual({
      ok: false,
      error: EMPTY_PROMPT_ERROR,
    });
  });
});
