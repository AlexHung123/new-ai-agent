import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('HTML explainer feature removed', () => {
  it('does not mount a Documents pill or HTML skill hint on the composer', () => {
    const empty = readSrc('../../components/EmptyChat.tsx');
    const input = readSrc('../../components/MessageInput.tsx');
    const emptyInput = readSrc('../../components/EmptyChatMessageInput.tsx');
    expect(empty).not.toMatch(/WritingHtmlHint/);
    expect(empty).not.toMatch(/Documents/);
    expect(input).not.toMatch(/HtmlSkillHint/);
    expect(emptyInput).not.toMatch(/HtmlSkillHint/);
    expect(input).not.toMatch(/WritingToolbarButtons/);
    expect(emptyInput).not.toMatch(/WritingToolbarButtons/);
  });

  it('does not send htmlMode with the chat body', () => {
    const chat = readSrc('../hooks/useChat.tsx');
    const schema = readSrc('../chat/chatBodySchema.ts');
    expect(chat).not.toMatch(/htmlMode:\s*htmlModeRef\.current/);
    expect(chat).not.toMatch(/setHtmlMode/);
    expect(schema).not.toMatch(/htmlMode/);
  });

  it('embeds previously generated pages in a sandboxed iframe without same-origin', () => {
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

  it('loads the iframe with a Bearer fetch, not a token query', () => {
    const embed = readSrc('../../components/HtmlPageEmbed.tsx');
    expect(embed).toMatch(/getAuthHeaders/);
    expect(embed).not.toMatch(/token=/);
    expect(embed).toMatch(/Download/);
  });

  it('does not register read_skill or am_render on writing or document templates', () => {
    const ctx = readSrc('../search/shared/agent/getSharedAgentContext.ts');
    expect(ctx).not.toMatch(/createReadSkillTool/);
    expect(ctx).not.toMatch(/createAmRenderTool/);
    expect(ctx).toMatch(/tools: \['fs_ls', 'fs_read', 'fs_grep', 'fs_find'\]/);
    expect(ctx).toMatch(
      /tools: \['query', 'get', 'multi_get', 'tree', 'status', 'grep'\]/,
    );
    expect(ctx).toMatch(/SHARED_AGENT_CONTEXT_REV = 17/);
    expect(ctx).toMatch(/'html-agent-template'/);
    expect(ctx).toMatch(/tools: \['html_get', 'html_set'\]/);
  });

  it('does not expose am_render on Writing or Document turns', () => {
    const writing = readSrc('../search/shared/prompts/writingTurnPrefix.ts');
    const writingAgent = readSrc('../search/writingAgent.ts');
    const document = readSrc('../search/documentAgent.ts');
    expect(writing).not.toMatch(/AM_RENDER_TOOL|READ_SKILL_TOOL|am_render|read_skill/);
    expect(writingAgent).not.toMatch(/bindTurnHtmlTool/);
    expect(document).not.toMatch(/AM_RENDER_TOOL|am_render|read_skill/);
    expect(document).not.toMatch(/bindTurnHtmlTool/);
  });

  it('does not ship skills/ or vendor/answer-me-with-html in the Docker image', () => {
    for (const name of ['Dockerfile', 'Dockerfile.slim']) {
      const docker = readFileSync(path.join(process.cwd(), name), 'utf8');
      expect(docker, name).not.toMatch(/COPY skills \.\/skills/);
      expect(docker, name).not.toMatch(/COPY vendor \.\/vendor/);
      expect(docker, name).not.toMatch(/answer-me-with-html/);
    }
  });

  it('does not wrap writing or document turns in html turn context', () => {
    const route = readSrc('../../app/api/chat/route.ts');
    expect(route).not.toMatch(/runWithHtmlTurn/);
    expect(route).toMatch(/runWithWritingTurn/);
    expect(route).toMatch(/runWithDocumentTurn/);
    expect(route).not.toMatch(/body\.htmlMode === true/);
  });
});
