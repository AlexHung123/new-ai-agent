import { describe, expect, it } from 'vitest';
import { COMFY_UNREACHABLE } from './comfyClient';
import { EMPTY_PROMPT_ERROR } from './comfyWorkflow';
import type { GeneratedImageEvent } from './generatedImageEvent';
import { ownedImageJob } from './imageJobStore';
import { runComfyImageJob } from './runComfyImageJob';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('runComfyImageJob', () => {
  it('rejects an empty prompt without calling Comfy', async () => {
    const events: GeneratedImageEvent[] = [];
    let called = false;
    const result = await runComfyImageJob({
      prompt: '   ',
      userId: '7',
      emit: (event) => events.push(event),
      fetchImpl: async () => {
        called = true;
        throw new Error('should not fetch');
      },
    });
    expect(result).toEqual({ ok: false, error: EMPTY_PROMPT_ERROR });
    expect(called).toBe(false);
    expect(events.at(-1)?.status).toBe('failed');
  });

  it('submits, polls, and returns a proxied view URL', async () => {
    const events: GeneratedImageEvent[] = [];
    let historyCalls = 0;
    const result = await runComfyImageJob({
      prompt: '  a plush fox  ',
      userId: '7',
      emit: (event) => events.push(event),
      sleep: async () => {},
      fetchImpl: async (url) => {
        const href = String(url);
        if (href.endsWith('/prompt')) {
          return jsonResponse({ prompt_id: 'job-9', node_errors: {} });
        }
        if (href.includes('/history/job-9')) {
          historyCalls += 1;
          if (historyCalls === 1) return jsonResponse({});
          return jsonResponse({
            'job-9': {
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
          });
        }
        if (href.endsWith('/queue')) {
          return jsonResponse({
            queue_running: [[0, 'job-9']],
            queue_pending: [],
          });
        }
        throw new Error(`unexpected ${href}`);
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prompt).toBe('a plush fox');
    expect(result.jobId).toBe('job-9');
    expect(result.imageUrl).toBe('/itms/ai/api/image/view?jobId=job-9');
    expect(typeof result.seed).toBe('number');
    expect(ownedImageJob('job-9', '7')?.images[0]?.filename).toBe(
      'minimax_h3_image_t2i_00001_.png',
    );
    expect(events.some((event) => event.status === 'generating')).toBe(true);
    expect(events.at(-1)).toMatchObject({
      status: 'succeeded',
      jobId: 'job-9',
      imageUrl: '/itms/ai/api/image/view?jobId=job-9',
    });
  });

  it('returns a clear error when Comfy is down', async () => {
    const result = await runComfyImageJob({
      prompt: 'a fox',
      userId: '7',
      fetchImpl: async () => {
        throw new Error('connect ECONNREFUSED');
      },
    });
    expect(result).toEqual({ ok: false, error: COMFY_UNREACHABLE });
  });
});
