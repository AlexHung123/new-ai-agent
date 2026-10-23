import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('Agent Writing empty HTML hint', () => {
  const hint = readSrc('../../components/WritingHtmlHint.tsx');
  const empty = readSrc('../../components/EmptyChat.tsx');
  const followUp = readSrc('../../components/MessageInput.tsx');
  const css = readFileSync(
    path.join(__dirname, '../../app/globals.css'),
    'utf8',
  );

  it('keeps Documents on the left and hides prompts until it is selected', () => {
    expect(hint).toMatch(/>\s*Documents\s*</);
    expect(hint).not.toMatch(
      /Finance|Data|Slides|Deep Research|Proposals|Scheduled Tasks/,
    );
    expect(hint).toMatch(/aria-pressed=\{documentsOpen\}/);
    expect(hint).toMatch(/useState\(false\)/);
    expect(hint).toMatch(/useState\(''\)/);
    expect(hint).toMatch(/documentsOpen \? \(/);
    expect(hint).toMatch(/setDocumentsOpen\(\(open\) => !open\)/);
    expect(hint).not.toMatch(/WRITING_HINT_SAMPLE/);
    expect(hint).not.toMatch(/setDraft\(''\)/);
    expect(hint).toMatch(/title: 'Write a polite but firm follow-up email'/);
    expect(hint).toMatch(
      /title: 'Write a weekly report example that goes beyond listing tasks'/,
    );
    expect(hint).toMatch(/title: 'Create a project meeting-minutes template'/);
    expect(hint).toMatch(/asking a colleague for feedback on my draft/);
    expect(hint).toMatch(/500-Chinese-character weekly report/);
    expect(hint).toMatch(/marking missing fields “Not specified\.”/);
    expect(hint).not.toMatch(/names the unanswered request/);
    expect(hint).not.toMatch(/one-line status/);
    expect(hint).not.toMatch(/open questions/);
    expect(hint).toMatch(
      /title: 'Turn materials into easy-to-understand visual notes'/,
    );
    expect(hint).toMatch(
      /title: 'Generate a UML use case diagram as an SVG'/,
    );
    expect(hint).toMatch(/RS-RBS-RDM-001 — Room Type Configuration/);
    expect(hint).toMatch(/prompt:/);
    expect(hint).toMatch(/HTML_SKILL_HINT/);
    expect(hint).toMatch(/setDraft\(item\.prompt\)/);
    expect(hint).not.toMatch(/setDraft\(text\)/);
    expect(hint).toMatch(/EmptyChatMessageInput/);
    expect(hint).toMatch(/onDraftChange/);
  });

  it('mounts the hint only on an empty Agent Writing chat', () => {
    expect(empty).toMatch(/WritingHtmlHint/);
    expect(empty).toMatch(/focusMode === 'agentWriting'/);
    expect(empty).toMatch(/writing-welcome/);
    expect(empty).not.toMatch(/DocumentHtmlHint/);
    expect(followUp).not.toMatch(/WritingHtmlHint/);
  });

  it('styles the category pill and suggestion chips', () => {
    expect(css).toMatch(
      /\.writing-hint-categories \{[\s\S]*justify-content:\s*flex-start/,
    );
    expect(css).toMatch(/\.writing-hint-category \{/);
    expect(css).toMatch(/\.writing-hint-category\.is-selected \{/);
    expect(css).toMatch(/\.writing-hint-suggestions \{/);
    expect(css).toMatch(/\.welcome-wiki\.writing-welcome \{/);
  });
});
