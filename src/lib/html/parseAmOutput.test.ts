import { describe, expect, it } from 'vitest';
import { parseAmOutput } from './parseAmOutput';

describe('parseAmOutput', () => {
  it('reads a success path from the checkmark line', () => {
    const out = parseAmOutput('✓ /tmp/pages/tcp.html\n');
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.path).toBe('/tmp/pages/tcp.html');
  });

  it('returns the CLI error text on failure', () => {
    const out = parseAmOutput(
      '✗ L12 [flow] unknown node\nCorrect example:\nA -> B: label\n',
    );
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toMatch(/L12/);
      expect(out.error).toMatch(/Correct example/);
    }
  });

  it('keeps STE warnings on success', () => {
    const out = parseAmOutput('✓ /tmp/a.html\nSTE 2 warnings: long sentence\n');
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.warnings).toMatch(/STE 2 warnings/);
  });
});
