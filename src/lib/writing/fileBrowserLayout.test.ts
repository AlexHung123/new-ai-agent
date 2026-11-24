import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('writing Knowledge FILES rail', () => {
  it('mounts a preview-only Knowledge tree under the agent card', () => {
    expect(
      existsSync(path.join(__dirname, '../../components/WritingKnowledgeFiles.tsx')),
    ).toBe(true);
    const rail = readSrc('../../components/WritingLeftRail.tsx');
    expect(rail).toMatch(/AgentCard/);
    expect(rail).toMatch(/WritingKnowledgeFiles/);
    const files = readSrc('../../components/WritingKnowledgeFiles.tsx');
    expect(files).toMatch(/FILES/);
    expect(files).toMatch(/useKnowledgeTree/);
    expect(readSrc('../knowledge/useKnowledgeTree.ts')).toMatch(/\/api\/knowledge\/tree/);
    expect(files).toMatch(/openKnowledgeFile/);
    expect(files).toMatch(/Upload documents on Knowledge/);
    expect(files).toMatch(/KnowledgeLibraryTabs/);
    expect(files).toMatch(/formatKnowledgePin/);
    expect(files).toMatch(/Shared policy folders will appear here/);
    const tabs = readSrc('../../components/KnowledgeLibraryTabs.tsx');
    expect(tabs).toMatch(/role="tablist"/);
    expect(tabs).toMatch(/aria-label="Library"/);
    expect(tabs).toMatch(/label: 'Private'/);
    expect(tabs).toMatch(/label: 'Public'/);
    expect(tabs).toMatch(/Lock/);
    expect(tabs).toMatch(/Globe/);
    expect(files).toMatch(/writing-knowledge-toggle/);
    expect(files).toMatch(/Collapse all folders/);
    expect(files).toMatch(/Expand all folders/);
    expect(files).toMatch(/FolderOpen/);
    expect(files).toMatch(/FileText/);
    expect(files).not.toMatch(/type=["']file["']/);
    expect(files).not.toMatch(/onDrop/);
    expect(files).not.toMatch(/Create folder/);
    expect(files).not.toMatch(/\/api\/writing\/files/);
  });

  it('does not restore writing upload or paperclip', () => {
    expect(
      existsSync(path.join(__dirname, '../../components/WritingFileBrowser.tsx')),
    ).toBe(false);
    expect(
      existsSync(path.join(__dirname, '../../components/WritingComposerTools.tsx')),
    ).toBe(false);
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).not.toMatch(/uploadWritingFile/);
    expect(chat).toMatch(/knowledgeFolder/);
    expect(chat).toMatch(/setKnowledgeFolder/);
  });

  it('offers an @ picker on Agent Writing composers', () => {
    for (const src of [
      readSrc('../../components/MessageInput.tsx'),
      readSrc('../../components/EmptyChatMessageInput.tsx'),
    ]) {
      expect(src).toMatch(/WritingKnowledgeAtMenu/);
      expect(src).not.toMatch(/WritingToolbarButtons/);
      expect(src).not.toMatch(/uploadWritingFile/);
    }
    const menu = readSrc('../../components/WritingKnowledgeAtMenu.tsx');
    expect(menu).toMatch(/atQueryAtCursor/);
    expect(menu).toMatch(/insertMention/);
    expect(menu).toMatch(/Folder/);
    expect(menu).toMatch(/FileText/);
    expect(menu).toMatch(/writing-knowledge-at-name/);
    expect(menu).not.toMatch(/writing-knowledge-at-kind/);
    expect(menu).toMatch(/knowledgeMentionToken/);
    expect(menu).toMatch(/listedNodes\(publicTree, 'public'/);
    expect(menu).toMatch(/listedNodes\(privateTree, 'private'/);
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).toMatch(/knowledgeFolder:/);
    for (const src of [
      readSrc('../../components/MessageInput.tsx'),
      readSrc('../../components/EmptyChatMessageInput.tsx'),
    ]) {
      expect(src).toMatch(/atQueryAtCursor/);
      expect(src).not.toMatch(/message\.includes\(['"]@['"]\)/);
    }
  });

  it('keeps the FILES rail visible when the preview panel is open', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).toMatch(/\.writing-knowledge-files/);
    expect(css).toMatch(/\.writing-knowledge-toggle/);
    expect(css).toMatch(/\.writing-knowledge-icon/);
    expect(css).toMatch(/\.writing-left-rail\s*\{[^}]*position:\s*fixed/s);
    expect(css).not.toMatch(
      /\.chat-workspace:has\(\.right-panel-open\)\s+\.writing-left-rail\s*\{[^}]*display:\s*none/s,
    );
  });

  it('pads empty writing chat so it clears the FILES rail', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).toMatch(
      /:has\(\.writing-knowledge-files\)\s+\.empty-chat-body\s*\{[^}]*padding-left/s,
    );
  });

  it('keeps the FILES rail mounted when the first message arrives', () => {
    const windowSrc = readSrc('../../components/ChatWindow.tsx');
    const empty = readSrc('../../components/EmptyChat.tsx');
    expect(windowSrc).toMatch(/WritingLeftRail/);
    expect(empty).not.toMatch(/WritingLeftRail/);
    expect(windowSrc).toMatch(
      /<WritingLeftRail \/>\s*\{messages\.length > 0 \? /s,
    );
    const files = readSrc('../../components/WritingKnowledgeFiles.tsx');
    expect(files).toMatch(/privateTree\.children/);
    expect(files).toMatch(/publicTree\.children/);
    expect(files).toMatch(/Loading files/);
  });

  it('renders structured knowledge items as documents, not folder trees', () => {
    const files = readSrc('../../components/WritingKnowledgeFiles.tsx');
    const menu = readSrc('../../components/WritingKnowledgeAtMenu.tsx');
    expect(files).toMatch(/isStructuredKnowledgeNode/);
    expect(files).toMatch(/writing-knowledge-wiki-badge/);
    expect(files).toMatch(/>Structured</);
    expect(files).toMatch(/structured \? 'is-file' : 'is-folder'/);
    expect(menu).toMatch(/flattenVisibleKnowledgeNodes/);
    expect(menu).toMatch(/isStructuredKnowledgeNode/);
    expect(menu).toMatch(/>Structured</);
    expect(files).not.toMatch(/維基/);
    expect(menu).not.toMatch(/維基/);
  });

});
