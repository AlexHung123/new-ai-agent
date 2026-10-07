import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('HTML explainer composer and embed', () => {
  it('puts the HTML hint label immediately after the writing attach buttons', () => {
    const input = readSrc('../../components/MessageInput.tsx');
    const empty = readSrc('../../components/EmptyChatMessageInput.tsx');
    for (const src of [input, empty]) {
      expect(src).toMatch(/WritingToolbarButtons[\s\S]*HtmlSkillHint/);
      expect(src).toMatch(/<HtmlSkillHint\s*\/>/);
    }
  });

  it('does not send htmlMode with the chat body', () => {
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).not.toMatch(/htmlMode:\s*htmlModeRef\.current/);
    expect(chat).not.toMatch(/setHtmlMode/);
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

  it('shows the HTML hint only for Writing and Document, with wording on hover', () => {
    const hint = readSrc('../../components/HtmlSkillHint.tsx');
    expect(hint).toMatch(/focusMode !== 'agentWriting'/);
    expect(hint).toMatch(/focusMode !== 'agentDocument'/);
    expect(hint).toMatch(/title=\{HTML_SKILL_HINT\}/);
    expect(hint).toMatch(/HTML explainer/);
    expect(hint).toMatch(/流程說明/);
    expect(hint).not.toMatch(/aria-pressed/);
    expect(hint).not.toMatch(/setHtmlMode/);
    expect(hint).not.toMatch(/<button/);
  });

  it('loads the iframe with a Bearer fetch, not a token query', () => {
    const embed = readSrc('../../components/HtmlPageEmbed.tsx');
    expect(embed).toMatch(/getAuthHeaders/);
    expect(embed).not.toMatch(/token=/);
    expect(embed).toMatch(/Download/);
  });

  it('registers read_skill on writing and document agent templates', () => {
    const ctx = readSrc('../search/shared/agent/getSharedAgentContext.ts');
    expect(ctx).toMatch(/createReadSkillTool/);
    expect(ctx).toMatch(
      /tools: \['fs_ls', 'fs_read', 'fs_grep', 'fs_find', 'read_skill', 'am_render'\]/,
    );
    expect(ctx).toMatch(/SHARED_AGENT_CONTEXT_REV = 8/);
  });

  it('keeps read_skill and am_render on Writing and Document even when the HTML tag is off', () => {
    const writing = readSrc('../search/shared/prompts/writingTurnPrefix.ts');
    const document = readSrc('../search/documentAgent.ts');
    expect(writing).toMatch(
      /return \[\.\.\.fsTools,\s*READ_SKILL_TOOL,\s*AM_RENDER_TOOL\]/,
    );
    expect(writing).not.toMatch(/if \(htmlMode\)/);
    expect(document).toMatch(
      /\[\.\.\.FS_TOOLS,\s*READ_SKILL_TOOL,\s*AM_RENDER_TOOL\]/,
    );
    expect(document).not.toMatch(/htmlMode \? \[\.\.\.FS_TOOLS/);
  });

  it('ships skills/ in the Docker build context', () => {
    const docker = readFileSync(path.join(process.cwd(), 'Dockerfile'), 'utf8');
    expect(docker).toMatch(/COPY skills \.\/skills/);
  });

  it('binds html turn context for Writing and Document without a composer tag', () => {
    const route = readSrc('../../app/api/chat/route.ts');
    expect(route).toMatch(/runWithHtmlTurn/);
    expect(route).toMatch(/focusMode === 'agentWriting'/);
    expect(route).toMatch(/runWithDocumentTurn/);
    expect(route).not.toMatch(/body\.htmlMode === true/);
  });
});
