import { describe, expect, it } from 'vitest';
import { clipTextToBudget } from './clipTextToBudget';

describe('clipTextToBudget', () => {
  it('returns original when under maxChars or maxChars <= 0', () => {
    expect(clipTextToBudget('hello', 100)).toBe('hello');
    expect(clipTextToBudget('hello', 0)).toBe('hello');
  });

  it('keeps head and tail with truncation marker', () => {
    const t = 'HEAD' + 'z'.repeat(200) + 'TAIL';
    const out = clipTextToBudget(t, 80);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.startsWith('HEAD')).toBe(true);
    expect(out.endsWith('TAIL')).toBe(true);
    expect(out).toContain('truncated to fit context budget');
  });
});
