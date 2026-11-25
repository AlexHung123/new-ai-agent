import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('native document preview wiring', () => {
  it('uses file-viewer for office and PDF, and markdown for source files', () => {
    const helper = readSrc('../writing/fileKind.ts');
    const knowledge = readSrc(
      '../../components/knowledge/KnowledgeFileManager.tsx',
    );
    const preview = readSrc('../../components/knowledge/KnowledgePreview.tsx');
    const writing = readSrc('../../components/WritingPreviewPanel.tsx');
    const viewer = readSrc('../../components/NativeDocumentPreview.tsx');
    const wrapper = readSrc('../../components/DocumentNativePreview.tsx');

    expect(helper).toMatch(/usesNativeDocumentPreview/);
    expect(helper).toMatch(/usesHtmlDocumentPreview/);
    expect(helper).toMatch(/usesInboxDocumentPreview/);
    expect(knowledge).toMatch(/usesInboxDocumentPreview/);
    expect(knowledge).toMatch(/content\?tree=inbox/);
    expect(knowledge).toMatch(/content\?tree=markdown/);
    expect(preview).toMatch(/DocumentNativePreview/);
    expect(preview).toMatch(/HtmlDocumentPreview/);
    expect(preview).toMatch(/markdown-to-jsx/);
    expect(writing).toMatch(/usesNativeDocumentPreview/);
    expect(writing).toMatch(/usesInboxDocumentPreview/);
    expect(writing).toMatch(/HtmlDocumentPreview/);
    expect(writing).toMatch(/content\?tree=inbox/);
    expect(writing).toMatch(/content\?tree=markdown/);
    expect(writing).toMatch(/\/original/);
    expect(writing).toMatch(/DocumentNativePreview/);
    expect(writing).toMatch(/markdown-to-jsx/);
    expect(viewer).toMatch(/@file-viewer\/react/);
    expect(viewer).toMatch(/@file-viewer\/preset-office/);
    expect(viewer).toMatch(/imageRenderer/);
    expect(viewer).not.toMatch(/getAuthBearerHeaders/);
    expect(viewer).toMatch(/setDefaultFileViewerAssetBaseUrl/);
    expect(viewer).toMatch(/\/itms\/ai\/file-viewer\//);
    expect(wrapper).toMatch(/ssr: false/);
  });

  it('does not expose private files as unauthenticated public URLs', () => {
    const knowledge = readSrc(
      '../../components/knowledge/KnowledgeFileManager.tsx',
    );
    const writing = readSrc('../../components/WritingPreviewPanel.tsx');
    const viewer = readSrc('../../components/NativeDocumentPreview.tsx');
    expect(knowledge).toMatch(/getAuthBearerHeaders\(\)/);
    expect(writing).toMatch(/getAuthBearerHeaders\(\)/);
    expect(knowledge).not.toMatch(/tree=inbox[^\n]*credentials: 'include'/);
    expect(viewer).not.toMatch(/\/api\/knowledge\/files\//);
    expect(viewer).not.toMatch(/\/api\/writing\/files\//);
  });
});
