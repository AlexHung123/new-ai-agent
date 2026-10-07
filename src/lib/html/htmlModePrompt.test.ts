import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const skillMd = readFileSync(
  join(process.cwd(), 'skills', 'html-explainer', 'SKILL.md'),
  'utf8',
);

describe('html-explainer SKILL.md', () => {
  it('tells the skill to use flow fences instead of mermaid', () => {
    expect(skillMd).toMatch(/^name:\s*html-explainer/m);
    expect(skillMd).toMatch(/^description:\s*Use when/m);
    expect(skillMd).toMatch(/```flow TB/);
    expect(skillMd).toMatch(/mermaid/i);
    expect(skillMd).toMatch(/\(Start\) -> \{/);
    expect(skillMd).not.toMatch(/This turn must produce/);
    expect(skillMd).not.toMatch(/composer HTML tag/i);
  });
});
