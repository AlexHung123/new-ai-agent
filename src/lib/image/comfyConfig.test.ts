import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COMFY_BASE_URL,
  DEFAULT_COMFY_TIMEOUT_MS,
  DEFAULT_COMFY_WORKFLOW_PATH,
  resolveComfyConfig,
  resolveWorkflowFilePath,
} from './comfyConfig';

describe('resolveComfyConfig', () => {
  it('uses defaults when the comfy section is missing or empty', () => {
    expect(resolveComfyConfig(undefined)).toEqual({
      baseUrl: DEFAULT_COMFY_BASE_URL,
      timeoutMs: DEFAULT_COMFY_TIMEOUT_MS,
      workflowPath: DEFAULT_COMFY_WORKFLOW_PATH,
    });
    expect(resolveComfyConfig({})).toEqual({
      baseUrl: DEFAULT_COMFY_BASE_URL,
      timeoutMs: DEFAULT_COMFY_TIMEOUT_MS,
      workflowPath: DEFAULT_COMFY_WORKFLOW_PATH,
    });
  });

  it('falls back when baseUrl, timeout, or path are typo/empty', () => {
    expect(
      resolveComfyConfig({
        baseUrl: '   ',
        timeoutMs: 'abc',
        workflowPath: '',
      }),
    ).toEqual({
      baseUrl: DEFAULT_COMFY_BASE_URL,
      timeoutMs: DEFAULT_COMFY_TIMEOUT_MS,
      workflowPath: DEFAULT_COMFY_WORKFLOW_PATH,
    });
  });

  it('accepts a configured ComfyUI server and timeout', () => {
    expect(
      resolveComfyConfig({
        baseUrl: 'http://192.168.1.50:8188/',
        timeoutMs: 900000,
        workflowPath: 'data/comfy/custom.json',
      }),
    ).toEqual({
      baseUrl: 'http://192.168.1.50:8188',
      timeoutMs: 900000,
      workflowPath: 'data/comfy/custom.json',
    });
  });
});

describe('resolveWorkflowFilePath', () => {
  it('joins a relative path with the data root', () => {
    expect(
      resolveWorkflowFilePath('data/comfy/minimax_h3_t2i.json', '/app'),
    ).toBe('/app/data/comfy/minimax_h3_t2i.json');
  });
});
