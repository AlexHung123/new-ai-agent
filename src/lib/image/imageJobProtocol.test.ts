import { describe, expect, it } from 'vitest';
import { canvasPhaseLabel, isTerminalImageStatus } from './imageJobProtocol';

describe('image job labels', () => {
  it('shows a waiting canvas until a job starts', () => {
    expect(canvasPhaseLabel(null)).toBe('Waiting for input');
    expect(canvasPhaseLabel('generating')).toBe('Generating…');
    expect(canvasPhaseLabel('queued')).toBe('Queued');
  });

  it('treats succeeded, failed, and cancelled as terminal', () => {
    expect(isTerminalImageStatus('succeeded')).toBe(true);
    expect(isTerminalImageStatus('failed')).toBe(true);
    expect(isTerminalImageStatus('cancelled')).toBe(true);
    expect(isTerminalImageStatus('generating')).toBe(false);
  });
});
