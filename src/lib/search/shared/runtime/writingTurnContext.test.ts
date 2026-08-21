import { describe, expect, it } from 'vitest';
import {
  getWritingTurnContext,
  runWithWritingTurn,
} from './writingTurnContext';

describe('writingTurnContext', () => {
  it('returns undefined outside a turn', () => {
    expect(getWritingTurnContext()).toBeUndefined();
  });

  it('does not leak nested inner root to the outer turn', async () => {
    const outer = { userId: 'u1', rootAbs: '/tmp/w1', files: [] };
    const inner = { userId: 'u2', rootAbs: '/tmp/w2', files: [] };
    const roots: string[] = [];
    await runWithWritingTurn(outer, async () => {
      roots.push(getWritingTurnContext()!.rootAbs);
      await runWithWritingTurn(inner, async () => {
        roots.push(getWritingTurnContext()!.rootAbs);
      });
      roots.push(getWritingTurnContext()!.rootAbs);
    });
    expect(roots).toEqual(['/tmp/w1', '/tmp/w2', '/tmp/w1']);
  });
});
