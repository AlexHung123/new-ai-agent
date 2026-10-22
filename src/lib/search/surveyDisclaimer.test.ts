import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Agent Survey accuracy disclaimer', () => {
  const src = readFileSync(
    path.join(__dirname, 'newSurverAgent.ts'),
    'utf8',
  );

  it('prefixes every survey reply with the accuracy disclaimer', () => {
    expect(src).toMatch(
      /SURVEY_ACCURACY_DISCLAIMER =[\s\S]*?AI生成的回覆可能不準確，使用前請仔細核實。[\s\S]*?const emitResponse = \(text: string\)/,
    );
    expect(src).toMatch(/\$\{SURVEY_ACCURACY_DISCLAIMER\}\$\{body\}/);
    expect(src).toMatch(/body\.includes\('AI生成的回覆可能不準確'\)/);
  });

  it('does not treat the disclaimer alone as a survey report', () => {
    expect(src).not.toMatch(
      /if \(text\.includes\('AI生成的回覆可能不準確'\)\) return true;/,
    );
  });
});
