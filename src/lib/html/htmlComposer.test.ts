import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('HTML explainer composer and embed', () => {
  it('puts the HTML toggle immediately after the writing attach buttons', () => {
    const input = readSrc('../../components/MessageInput.tsx');
    const empty = readSrc('../../components/EmptyChatMessageInput.tsx');
    for (const src of [input, empty]) {
      expect(src).toMatch(/WritingToolbarButtons[\s\S]*HtmlModeToggle/);
      expect(src).toMatch(/<HtmlModeToggle\s*\/>/);
    }
  });

  it('sends htmlMode with the chat body', () => {
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).toMatch(/htmlMode:\s*htmlModeRef\.current/);
  });

  it('embeds pages in a sandboxed iframe without same-origin', () => {
    const embed = readSrc('../../components/HtmlPageEmbed.tsx');
    expect(embed).toMatch(/sandbox=["']allow-scripts["']/);
    expect(embed).not.toMatch(/allow-same-origin/);
    expect(embed).toMatch(/srcDoc|srcdoc/);
  });

  it('mounts HtmlPageEmbed from assistant markdown links', () => {
    const box = readSrc('../../components/MessageBox.tsx');
    expect(box).toMatch(/parseHtmlPageIds/);
    expect(box).toMatch(/HtmlPageEmbed/);
  });

  it('shows the HTML toggle only for Writing and Document', () => {
    const toggle = readSrc('../../components/HtmlModeToggle.tsx');
    expect(toggle).toMatch(/focusMode !== 'agentWriting'/);
    expect(toggle).toMatch(/focusMode !== 'agentDocument'/);
  });

  it('loads the iframe with a Bearer fetch, not a token query', () => {
    const embed = readSrc('../../components/HtmlPageEmbed.tsx');
    expect(embed).toMatch(/getAuthHeaders/);
    expect(embed).not.toMatch(/token=/);
    expect(embed).toMatch(/Download/);
  });

  it('applies htmlMode only for Writing and Document on the chat route', () => {
    const route = readSrc('../../app/api/chat/route.ts');
    expect(route).toMatch(/body\.htmlMode === true/);
    expect(route).toMatch(/focusMode === 'agentWriting'/);
    expect(route).toMatch(/focusMode === 'agentDocument'/);
    expect(route).toMatch(/runWithHtmlTurn/);
  });
});
