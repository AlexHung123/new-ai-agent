import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('knowledge UI contracts', () => {
  it('has a Knowledge page titled like History', () => {
    const layout = readSrc('../../app/knowledge/layout.tsx');
    const page = readSrc('../../app/knowledge/page.tsx');
    expect(layout).toMatch(/Knowledge - AI Agent/);
    expect(page).toMatch(/FolderOpen/);
    expect(page).toMatch(/Knowledge/);
    expect(page).toMatch(/KnowledgeFileManager/);
  });

  it('uses an inline new-folder field, upload, and drag-and-drop', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const tree = readSrc('../../components/knowledge/KnowledgeTree.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    expect(manager).toMatch(/knowledge-new-folder/);
    expect(manager).not.toMatch(/window\.prompt/);
    expect(manager).toMatch(/knowledge-upload/);
    expect(manager).toMatch(/KNOWLEDGE_ACCEPT/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/tree/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/folders/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/files/);
    expect(manager).not.toMatch(/192\.168\.1\.56/);
    expect(tree).toMatch(/onDrop/);
    expect(listing).toMatch(/onDrop/);
    expect(listing).toMatch(/Create a folder or drop files here/);
  });

  it('searches through the app API and previews markdown', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    const preview = readSrc('../../components/knowledge/KnowledgePreview.tsx');
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/search/);
    expect(manager).toMatch(/limit: 10/);
    expect(manager).toMatch(/vsearch/);
    expect(manager).toMatch(/content\?tree=markdown/);
    expect(manager).toMatch(/findFileForSearchHit/);
    expect(listing).toMatch(/onOpenHit/);
    expect(preview).toMatch(/markdown-to-jsx/);
    expect(preview).toMatch(/File not found/);
  });

  it('does not call Dochub or QMD from the browser', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    expect(manager).not.toMatch(/\/v1\/search/);
    expect(manager).not.toMatch(/qmd mcp/i);
  });
});
