import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTypoSummaryInstruction } from './typoSummaryConfig';
import {
  resolveTypoSummaryInstruction,
  TYPO_SUMMARY_INSTRUCTION,
} from './transcriptFormat';

describe('getTypoSummaryInstruction', () => {
  it('reads voice.typoSummaryInstruction and falls back to the default', () => {
    const source = readFileSync(
      path.join(__dirname, 'typoSummaryConfig.ts'),
      'utf8',
    );
    expect(source).toMatch(/getConfig\('voice'\)/);
    expect(source).toMatch(/resolveTypoSummaryInstruction/);

    const fromConfig = getTypoSummaryInstruction();
    expect(fromConfig).toBe(
      resolveTypoSummaryInstruction({ typoSummaryInstruction: fromConfig }),
    );
    expect(fromConfig.length).toBeGreaterThan(0);
    expect(TYPO_SUMMARY_INSTRUCTION).toBe(
      'help me to find out all the typo, mistakes and correct it, and then summarize it',
    );
  });
});
