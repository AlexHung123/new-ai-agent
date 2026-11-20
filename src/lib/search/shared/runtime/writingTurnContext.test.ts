import { describe, expect, it } from 'vitest';
import {
  getWritingTurnContext,
  runWithWritingTurn,
} from './writingTurnContext';

describe('writingTurnContext', () => {
  it('returns undefined outside a turn', () => {
    expect(getWritingTurnContext()).toBeUndefined();
  });

  it('does not leak nested inner pin to the outer turn', async () => {
    const outer = {
      userId: 'u1',
      pin: 'a',
      mentionedDocuments: [],
      tree: null,
    };
    const inner = {
      userId: 'u2',
      pin: 'b',
      mentionedDocuments: [],
      tree: null,
    };
    const pins: Array<string | null> = [];
    await runWithWritingTurn(outer, async () => {
      pins.push(getWritingTurnContext()!.pin);
      await runWithWritingTurn(inner, async () => {
        pins.push(getWritingTurnContext()!.pin);
      });
      pins.push(getWritingTurnContext()!.pin);
    });
    expect(pins).toEqual(['a', 'b', 'a']);
  });
});
