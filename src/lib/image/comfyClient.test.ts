import { describe, expect, it } from 'vitest';
import {
  COMFY_NO_IMAGE,
  COMFY_UNREACHABLE,
  imagesFromOutputs,
  parseComfyHistory,
  queuePhase,
  submitComfyPrompt,
} from './comfyClient';

describe('parseComfyHistory', () => {
  it('stays pending until the prompt appears', () => {
    expect(parseComfyHistory({}, 'abc')).toEqual({ state: 'pending' });
    expect(parseComfyHistory({ other: {} }, 'abc')).toEqual({
      state: 'pending',
    });
  });

  it('returns images from the SaveImage node', () => {
    expect(
      parseComfyHistory(
        {
          abc: {
            outputs: {
              '9': {
                images: [
                  {
                    filename: 'minimax_h3_image_t2i_00001_.png',
                    subfolder: '',
                    type: 'output',
                  },
                ],
              },
            },
            status: { completed: true, status_str: 'success' },
          },
        },
        'abc',
      ),
    ).toEqual({
      state: 'succeeded',
      images: [
        {
          filename: 'minimax_h3_image_t2i_00001_.png',
          subfolder: '',
          type: 'output',
        },
      ],
    });
  });

  it('fails when Comfy reports an execution error', () => {
    expect(
      parseComfyHistory(
        {
          abc: {
            status: {
              completed: true,
              status_str: 'error',
              messages: [
                [
                  'execution_error',
                  { exception_message: 'CUDA out of memory' },
                ],
              ],
            },
          },
        },
        'abc',
      ),
    ).toEqual({ state: 'failed', error: 'CUDA out of memory' });
  });

  it('fails when a completed job has no image', () => {
    expect(
      parseComfyHistory(
        {
          abc: {
            outputs: {},
            status: { completed: true, status_str: 'success' },
          },
        },
        'abc',
      ),
    ).toEqual({ state: 'failed', error: COMFY_NO_IMAGE });
  });
});

describe('imagesFromOutputs', () => {
  it('ignores path-traversal filenames', () => {
    expect(
      imagesFromOutputs({
        '9': { images: [{ filename: '../secret.png', type: 'output' }] },
      }),
    ).toEqual([]);
  });
});

describe('queuePhase', () => {
  it('distinguishes queued and running jobs', () => {
    expect(
      queuePhase({ queue_running: [[0, 'a']], queue_pending: [[1, 'b']] }, 'b'),
    ).toBe('queued');
    expect(
      queuePhase({ queue_running: [[0, 'a']], queue_pending: [] }, 'a'),
    ).toBe('generating');
    expect(queuePhase({ queue_running: [], queue_pending: [] }, 'a')).toBe(
      null,
    );
  });
});

describe('submitComfyPrompt', () => {
  it('returns a clear error when Comfy is down', async () => {
    const result = await submitComfyPrompt({
      baseUrl: 'http://127.0.0.1:8188',
      workflow: {},
      fetchImpl: async () => {
        throw new Error('connect ECONNREFUSED');
      },
    });
    expect(result).toEqual({
      ok: false,
      status: 502,
      error: COMFY_UNREACHABLE,
    });
  });

  it('reads the prompt_id from a successful submit', async () => {
    const result = await submitComfyPrompt({
      baseUrl: 'http://127.0.0.1:8188',
      workflow: { '9': {} },
      fetchImpl: async () =>
        new Response(JSON.stringify({ prompt_id: 'job-1', node_errors: {} }), {
          status: 200,
        }),
    });
    expect(result).toEqual({ ok: true, promptId: 'job-1' });
  });
});
