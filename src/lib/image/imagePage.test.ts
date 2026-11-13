import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('Agent Image page contract', () => {
  it('uses the Grok-style layout labels and server proxy', () => {
    const page = readSrc('../../app/image/page.tsx');
    expect(page).toMatch(/Waiting for input/);
    expect(page).toMatch(/Agent Image/);
    expect(page).toMatch(/chatImageAgent:execute/);
    expect(page).toMatch(/\/itms\/ai\/api\/image\/generate/);
    expect(page).toMatch(/\/itms\/ai\/api\/image\/jobs\//);
    expect(page).toMatch(/\/itms\/ai\/api\/image\/view/);
    expect(page).toMatch(/getAuthHeaders/);
    expect(page).not.toMatch(/正在等待输入/);
    expect(page).not.toMatch(/127\.0\.0\.1:8188/);
  });
});
