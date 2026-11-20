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
    expect(files).toMatch(/\/api\/knowledge\/tree/);
    expect(files).toMatch(/openKnowledgeFile/);
    expect(files).toMatch(/Upload documents on Knowledge/);
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

  it('keeps the FILES rail visible when the preview panel is open', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).toMatch(/\.writing-knowledge-files/);
    expect(css).toMatch(/\.writing-left-rail\s*\{[^}]*position:\s*fixed/s);
    expect(css).not.toMatch(
      /\.chat-workspace:has\(\.right-panel-open\)\s+\.writing-left-rail\s*\{[^}]*display:\s*none/s,
    );
  });
});
