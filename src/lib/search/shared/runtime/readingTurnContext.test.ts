import { describe, expect, it } from 'vitest';
import {
  getReadingTurnContext,
  runWithReadingTurn,
} from './readingTurnContext';

describe('readingTurnContext', () => {
  it('returns undefined outside a turn', () => {
    expect(getReadingTurnContext()).toBeUndefined();
  });

  it('exposes the bound PDF inside runWithReadingTurn', async () => {
    const ctx = {
      userId: 'u1',
      fileId: 'f1',
      title: 'paper.pdf',
      rootAbs: '/tmp/read',
      status: 'ready' as const,
    };
    const seen = await runWithReadingTurn(ctx, async () => getReadingTurnContext());
    expect(seen).toEqual(ctx);
    expect(getReadingTurnContext()).toBeUndefined();
  });
});
