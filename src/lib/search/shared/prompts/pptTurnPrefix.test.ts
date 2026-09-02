import { describe, expect, it } from 'vitest';
import { buildPptUserPrompt } from './pptTurnPrefix';
import { emptyPptDeck } from '@/lib/ppt/types';

describe('buildPptUserPrompt', () => {
  it('injects stage and forbids skipping ahead', () => {
    const prompt = buildPptUserPrompt('做一份内网培训 PPT', emptyPptDeck());
    expect(prompt).toContain('stage: discover');
    expect(prompt).toContain('[User request]\n做一份内网培训 PPT');
    expect(prompt).toContain('Do not outline yet');
  });
});
