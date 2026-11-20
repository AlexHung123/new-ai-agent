import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('sidebar nav', () => {
  it('shows Knowledge after History and keeps Admin last', () => {
    const sidebar = readSrc('../../components/Sidebar.tsx');
    expect(sidebar).toMatch(/FolderOpen/);
    expect(sidebar).toMatch(/href: '\/knowledge'/);
    expect(sidebar).toMatch(/label: 'Knowledge'/);

    const historyAt = sidebar.indexOf("label: 'History'");
    const knowledgeAt = sidebar.indexOf("label: 'Knowledge'");
    const adminAt = sidebar.indexOf("label: 'Admin'");
    expect(historyAt).toBeGreaterThanOrEqual(0);
    expect(knowledgeAt).toBeGreaterThan(historyAt);
    expect(adminAt).toBeGreaterThan(knowledgeAt);

    expect(sidebar).toMatch(
      /wide=\{segments\.includes\('agents'\) \|\| segments\.includes\('knowledge'\)\}/,
    );
    expect(sidebar).toMatch(/isAdmin/);
  });
});
