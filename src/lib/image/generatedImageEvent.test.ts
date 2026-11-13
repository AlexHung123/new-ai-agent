import { describe, expect, it } from 'vitest';
import {
  GENERATED_IMAGE_EVENT_TYPE,
  imageViewUrl,
  isGeneratedImageEvent,
  type GeneratedImageEvent,
} from './generatedImageEvent';

describe('generated_image event payload', () => {
  it('describes a proxied view URL after a successful generation', () => {
    const event: GeneratedImageEvent = {
      status: 'succeeded',
      prompt: 'a red fox',
      jobId: 'job-1',
      imageUrl: imageViewUrl('job-1'),
      seed: 42,
      error: null,
    };
    expect(GENERATED_IMAGE_EVENT_TYPE).toBe('generated_image');
    expect(isGeneratedImageEvent(event)).toBe(true);
    expect(event.imageUrl).toBe('/itms/ai/api/image/view?jobId=job-1');
  });

  it('rejects payloads without a known status', () => {
    expect(isGeneratedImageEvent({ imageUrl: '/x' })).toBe(false);
    expect(isGeneratedImageEvent(null)).toBe(false);
  });
});
