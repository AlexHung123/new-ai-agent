import { describe, expect, it } from 'vitest';
import { isScrollAtTail } from './scroll';

describe('isScrollAtTail', () => {
  it('treats the last 80px of a pane as the tail', () => {
    expect(isScrollAtTail(920, 400, 1400, 80)).toBe(true);
    expect(isScrollAtTail(800, 400, 1400, 80)).toBe(false);
  });

  it('is at the tail when content fits in the pane', () => {
    expect(isScrollAtTail(0, 400, 300)).toBe(true);
  });
});
