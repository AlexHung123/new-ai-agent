import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('Agent HTML canvas', () => {
  it('inlines CSS and JS before showing the live preview', () => {
    const canvas = readSrc('../../components/HtmlCanvas.tsx');
    expect(canvas).toMatch(/inlineHtmlAssets|\/api\/wcms-content\/inline/);
    const prompt = readFileSync(
      path.join(process.cwd(), 'data', 'prompts', 'agentHtml.md'),
      'utf8',
    );
    expect(prompt).toMatch(/style attribute/);
    expect(prompt).toMatch(/Do not add a <style> tag/);
    expect(prompt).not.toMatch(/Put CSS in <style>/);
    expect(prompt).toMatch(/<script>/);
    const fallback = readSrc('../search/shared/prompts/htmlAgentSystemPrompt.ts');
    expect(fallback).toMatch(/Do not add a <style> tag/);
    expect(fallback).not.toMatch(/Put CSS in <style>/);
  });

  it('uses the iTMS TinyMCE allow-list and a sandboxed preview iframe', () => {
    const canvas = readSrc('../../components/HtmlCanvas.tsx');
    expect(canvas).toMatch(/WCMS_TINYMCE_INIT/);
    expect(canvas).toMatch(/sandbox=\{HTML_PREVIEW_SANDBOX\}/);
    expect(canvas).toMatch(/srcDoc=\{previewDoc\}/);
    expect(canvas).not.toMatch(/allow-same-origin/);
    expect(canvas).toMatch(/focusMode !== 'agentHtml'/);
  });

  it('deep-links Agent HTML from wcmsContentId on the agents page', () => {
    const page = readSrc('../../app/agents/page.tsx');
    expect(page).toMatch(/wcmsContentId/);
    expect(page).toMatch(/agentHtmlChatHref/);
    expect(page).toMatch(/agentHtml/);
  });

  it('copies TinyMCE into public after the Docker public COPY', () => {
    for (const name of ['Dockerfile', 'Dockerfile.slim']) {
      const docker = readFileSync(path.join(process.cwd(), name), 'utf8');
      expect(docker).toMatch(/COPY public \.\/public/);
      expect(docker).toMatch(/scripts\/copy-tinymce\.js/);
      const scriptCopy = docker.indexOf('COPY scripts/copy-tinymce.js');
      const npmCi = docker.indexOf('RUN npm ci');
      const publicCopy = docker.indexOf('COPY public ./public');
      const copyAgain = docker.lastIndexOf('node scripts/copy-tinymce.js');
      expect(scriptCopy).toBeGreaterThan(-1);
      expect(scriptCopy).toBeLessThan(npmCi);
      expect(publicCopy).toBeLessThan(copyAgain);
    }
  });

  it('loads a saved WCMS language and does not let stored focus hide a query bind', () => {
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).toMatch(/setWcmsLang:\s*\(lang:/);
    expect(chat).toMatch(/setWcmsLang,/);
    expect(chat).toMatch(/urlWcmsBoot\(searchParams\)/);
    const boot = chat.indexOf('urlWcmsBoot(searchParams)');
    const stored = chat.indexOf("focusStateFromStored(safeLocalStorageGet('focusMode'))");
    expect(boot).toBeGreaterThan(-1);
    expect(boot).toBeLessThan(stored);
    expect(chat).toMatch(/htmlReady/);
    expect(chat).toMatch(/shouldApplyFetchedWcmsHtml/);
    expect(chat).not.toMatch(/draftHtml/);
    expect(chat).not.toMatch(/restoreWcmsDraft/);
    const chatRoute = readFileSync(
      path.join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );
    expect(chatRoute).not.toMatch(/readWcmsWorkingHtml|saveWcmsWorkingHtml/);
    expect(chat).not.toMatch(
      /wcmsLang, wcmsFileBaseHref, userId/,
    );
  });

  it('keeps editor changes on the canvas without writing a session file', () => {
    const canvas = readSrc('../../components/HtmlCanvas.tsx');
    expect(canvas).toMatch(/suppressEditorEcho/);
    expect(canvas).not.toMatch(/method: 'PUT'/);
    expect(canvas).not.toMatch(/Restore unsaved draft/);
    expect(canvas).toMatch(/targetOrigin/);
    expect(canvas).not.toMatch(/postMessage\(message, '\*'\)/);
  });

  it('clears the WCMS bind when leaving Agent HTML', () => {
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).toMatch(/resolved !== 'agentHtml'/);
    expect(chat).toMatch(/setWcmsPageIndex\(0\)/);
    expect(chat).toMatch(/setWcmsFileBaseHref\(null\)/);
  });

  it('docks the canvas in a resizable right panel instead of a floating card', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src', 'app', 'globals.css'),
      'utf8',
    );
    expect(css).toMatch(/\.html-canvas \{\s*display: flex;/);
    expect(css).not.toMatch(/\.html-canvas \{\s*display: none;/);
    expect(css).toMatch(/\.right-panel-container/);
    expect(css).toMatch(/\.panel-resize-handle/);
    expect(css).not.toMatch(/\.html-canvas \{[^}]*position:\s*fixed/);
    const canvas = readSrc('../../components/HtmlCanvas.tsx');
    expect(canvas).toMatch(/insertBackToWcms/);
    expect(canvas).toMatch(/Insert back to TinyMCE/);
    const chat = readSrc('../../components/ChatWindow.tsx');
    expect(chat).not.toMatch(/InsertBackToWcms/);
    expect(chat).not.toMatch(/Content is OK — insert back to WCMS/);
    expect(chat).toMatch(/ChatRightPanel/);
    expect(css).not.toMatch(/\.html-insert-back/);
    expect(css).not.toMatch(/Content is OK — insert back to WCMS/);
    const prompt = readFileSync(
      path.join(process.cwd(), 'data', 'prompts', 'agentHtml.md'),
      'utf8',
    );
    expect(prompt).toMatch(/Do not insert html, head, body/);
    expect(prompt).toMatch(/extended_valid_elements/);
  });
});
