import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const vendorRoot = path.join(
  process.cwd(),
  'vendor',
  'answer-me-with-html',
);

describe('vendored answer-me-with-html CLI', () => {
  it('pins a commit and ships the bundled CLI plus MIT license', () => {
    const version = readFileSync(path.join(vendorRoot, 'VERSION'), 'utf8');
    expect(version).toMatch(/QingYunA\/answer-me-with-html/);
    expect(version).toMatch(/[0-9a-f]{40}/);
    expect(version).toMatch(/0\.4\.12/);
    expect(existsSync(path.join(vendorRoot, 'scripts', 'am.mjs'))).toBe(true);
    expect(readFileSync(path.join(vendorRoot, 'LICENSE'), 'utf8')).toMatch(
      /MIT License/,
    );
    expect(readFileSync(path.join(vendorRoot, 'scripts', 'am.mjs'), 'utf8')).toMatch(
      /var VERSION = "0\.4\.12"/,
    );
  });
});
