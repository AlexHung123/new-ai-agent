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
    expect(page).toMatch(/KnowledgeFileManager/);
  });

  it('shows a loading state before the tree arrives', () => {
    const page = readSrc('../../app/knowledge/page.tsx');
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const loading = readSrc('../../components/knowledge/KnowledgeLoading.tsx');
    const routeLoading = readSrc('../../app/knowledge/loading.tsx');
    expect(page).toMatch(/KnowledgeLoading/);
    expect(page).not.toMatch(/fallback=\{null\}/);
    expect(manager).toMatch(/initialLoading/);
    expect(manager).toMatch(/KnowledgeLoading/);
    expect(loading).toMatch(/Loading files/);
    expect(loading).toMatch(/knowledge-loading-spinner/);
    expect(routeLoading).toMatch(/KnowledgeLoading/);
  });

  it('fills the pane like the knowledge-base home, not a centered column', () => {
    const sidebar = readSrc('../../components/Sidebar.tsx');
    const layout = readSrc('../../components/Layout.tsx');
    const css = readSrc('../../app/globals.css');
    expect(sidebar).toMatch(
      /flush=\{[^}]*segments\.includes\('knowledge'\)/,
    );
    expect(sidebar).not.toMatch(
      /wide=\{segments\.includes\('agents'\) \|\| segments\.includes\('knowledge'\)\}/,
    );
    expect(layout).toMatch(/max-w-none/);
    expect(css).toMatch(/\.app-main > div:has\(\.knowledge-manager\)/);
    const managerStart = css.indexOf('.knowledge-manager {');
    const managerBlock = css.slice(
      managerStart,
      css.indexOf('}', managerStart),
    );
    expect(managerBlock).toMatch(/width:\s*100%/);
    expect(managerBlock).not.toMatch(/max-width/);
    expect(managerBlock).not.toMatch(/margin:\s*0 auto/);
  });

  it('uses a folder tree and files table, not a card-grid home', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const tree = readSrc('../../components/knowledge/KnowledgeTree.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    expect(manager).toMatch(/knowledge-detail-layout/);
    expect(manager).toMatch(/Create folder/);
    expect(manager).toMatch(/knowledge-search-combo/);
    expect(manager).toMatch(/FolderPlus/);
    expect(manager).not.toMatch(/knowledge base/i);
    expect(manager).not.toMatch(/knowledge-folder-grid/);
    expect(manager).not.toMatch(/knowledge-page-title/);
    expect(manager).toMatch(/KnowledgeCreateFolderDialog/);
    expect(manager).toMatch(/canWritePublic/);
    expect(manager).not.toMatch(/window\.prompt/);
    expect(manager).toMatch(/knowledge-upload/);
    expect(manager).toMatch(/knowledge-detail-folder-card/);
    expect(manager).toMatch(/knowledge-storage-bar/);
    expect(manager).toMatch(/KNOWLEDGE_ACCEPT/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/tree/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/folders/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/files/);
    expect(manager).not.toMatch(/192\.168\.1\.56/);
    expect(tree).toMatch(/onDrop/);
    expect(tree).toMatch(/knowledge-tree-toggle/);
    expect(tree).toMatch(/FolderRows/);
    expect(tree).toMatch(/knowledge-tree-folder-icon/);
    expect(manager).toMatch(/aria-label="Folder tree"/);
    expect(manager).toMatch(/KnowledgeLibraryTabs/);
    expect(manager).toMatch(/defaultLibrary=\{currentLibrary\}/);
    expect(listing).toMatch(/onDrop/);
    expect(listing).toMatch(/knowledge-files-table/);
    expect(listing).toMatch(/Upload date/);
    expect(listing).toMatch(/Parse/);
    expect(listing).toMatch(/Preview/);
    expect(listing).toMatch(/Download/);
  });

  it('searches through the app API and previews markdown', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    const preview = readSrc('../../components/knowledge/KnowledgePreview.tsx');
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/search/);
    expect(manager).toMatch(/limit: 10/);
    expect(manager).toMatch(/vsearch/);
    expect(manager).toMatch(/content\?tree=markdown/);
    expect(manager).toMatch(/resolveSearchHitDisplay/);
    expect(listing).toMatch(/resolveSearchHitDisplay/);
    expect(listing).toMatch(/resolved\.title/);
    expect(listing).toMatch(/hit\.snippet/);
    expect(listing).not.toMatch(/hit\.title \|\| hit\.file/);
    expect(listing).toMatch(/onOpenHit/);
    expect(preview).toMatch(/markdown-to-jsx/);
    expect(preview).toMatch(/File not found/);
    expect(preview).toMatch(/knowledge-preview-dialog/);
    expect(preview).toMatch(/aria-label="Close preview"/);
    expect(preview).toMatch(/showModal/);
    expect(manager).toMatch(/onClose=\{clearPreview\}/);
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

  it('uses a create-folder dialog with private and public choices', () => {
    const dialog = readSrc('../../components/KnowledgeCreateFolderDialog.tsx');
    expect(dialog).toMatch(/Create folder/);
    expect(dialog).toMatch(/Shared with all signed-in users/);
    expect(dialog).toMatch(/canWritePublic/);
    expect(dialog).not.toMatch(/window\.prompt/);
    const empty = readSrc('../../components/EmptyChat.tsx');
    expect(empty).not.toMatch(/DocumentPicker/);
    expect(empty).toMatch(/isKnowledgeFocusMode/);
    const chip = readSrc('../../components/KnowledgeScopeChip.tsx');
    expect(chip).toMatch(/Pinned folder/);
    expect(chip).toMatch(/Structured/);
    expect(chip).toMatch(/Unpin folder/);
    const scope = readSrc('../../components/KnowledgeComposerScope.tsx');
    expect(scope).toMatch(/parseKnowledgePins/);
    expect(scope).toMatch(/knowledge-scope-chips/);
    expect(scope).toMatch(/pinCapMessage/);
    expect(scope).toMatch(/removeKnowledgePin/);
    const files = readSrc('../../components/WritingKnowledgeFiles.tsx');
    expect(files).toMatch(/toggleKnowledgePin/);
    expect(files).toMatch(/activePins/);
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).toMatch(/toggleKnowledgePin/);
    expect(chat).toMatch(/knowledgeFolder:/);
  });

  it('hides visibility choices when creating a folder inside a parent', () => {
    const dialog = readSrc('../../components/KnowledgeCreateFolderDialog.tsx');
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    expect(dialog).toMatch(/inheritedFolderSubtitle/);
    expect(dialog).toMatch(/!currentPath \? \(/);
    expect(dialog).toMatch(/knowledge-visibility/);
    expect(dialog).toMatch(/currentPath\s*\?\s*defaultLibrary/);
    expect(manager).toMatch(/currentPath=\{listingPath\}/);
    expect(manager).toMatch(/listingPath \? currentLibrary : input\.library/);
    const files = readSrc('../../components/WritingKnowledgeFiles.tsx');
    expect(files).not.toMatch(/Create folder/);
  });

  it('renders structured folders as document rows, not expandable trees', () => {
    const tree = readSrc('../../components/knowledge/KnowledgeTree.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    expect(tree).toMatch(/isStructuredKnowledgeNode/);
    expect(tree).toMatch(/knowledge-structured-badge/);
    expect(tree).toMatch(/Structured/);
    expect(tree).toMatch(/FileText/);
    expect(listing).toMatch(/isStructuredKnowledgeNode/);
    expect(listing).toMatch(/onOpenStructured/);
    expect(listing).toMatch(/Bound document/);
    expect(listing).toMatch(/knowledge-structured-badge/);
    expect(listing).toMatch(/Structured/);
    expect(manager).toMatch(/onOpenStructured=\{openStructured\}/);
    expect(manager).toMatch(/structuredIndexFile/);
    expect(manager).toMatch(/parentKnowledgePath/);
    expect(manager).not.toMatch(/維基/);
    expect(listing).not.toMatch(/維基/);
    expect(tree).not.toMatch(/維基/);
  });

});
