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

  it('keeps knowledge client modules off convert, config, and dochubClient', () => {
    const files = [
      '../../components/knowledge/KnowledgeFileManager.tsx',
      '../../components/knowledge/KnowledgeListing.tsx',
      '../../components/knowledge/KnowledgeTree.tsx',
      '../../components/knowledge/KnowledgePreview.tsx',
      '../../app/knowledge/page.tsx',
    ];
    for (const file of files) {
      const src = readSrc(file);
      expect(src).not.toMatch(/knowledge\/convert['"]/);
      expect(src).not.toMatch(/knowledge\/config['"]/);
      expect(src).not.toMatch(/knowledge\/dochubClient['"]/);
      expect(src).not.toMatch(/192\.168\.1\.56/);
      expect(src).not.toMatch(/\/v1\//);
    }
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    expect(manager).toMatch(/@\/lib\/knowledge\/filenames/);
    const filenames = readSrc('./filenames.ts');
    expect(filenames).not.toMatch(/from ['"]\.\/config['"]/);
    expect(filenames).not.toMatch(/from ['"]\.\/convert['"]/);
    expect(filenames).not.toMatch(/node:fs|configManager|Buffer/);
  });

  it('seeds ingest polling from tree task ids, times out, and shows last_error', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    expect(manager).toMatch(/fileTaskIds/);
    expect(manager).toMatch(/timed_out/);
    expect(manager).toMatch(/clearPreview/);
    expect(listing).toMatch(/last_error/);
  });
});
