import { describe, expect, it } from 'vitest';
import { assistantContentAfterAbort, STOPPED_PLACEHOLDER } from './abortedReply';

describe('assistantContentAfterAbort', () => {
  it('uses (stopped) when the user aborts before any assistant text', () => {
    expect(assistantContentAfterAbort('')).toBe(STOPPED_PLACEHOLDER);
    expect(assistantContentAfterAbort('   ')).toBe(STOPPED_PLACEHOLDER);
  });

  it('keeps partial streamed text when the user aborts mid-reply', () => {
    expect(assistantContentAfterAbort('Hello')).toBe('Hello');
  });
});
