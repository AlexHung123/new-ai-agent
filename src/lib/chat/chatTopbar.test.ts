import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

function cssRule(css: string, selector: string): string {
  const normalized = css.replace(/\r\n/g, '\n');
  const start = normalized.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  const open = normalized.indexOf('{', start);
  const close = normalized.indexOf('}', open);
  return normalized.slice(open + 1, close);
}

describe('chat topbar layout', () => {
  it('is a compact toolbar with new-chat and close, without share', () => {
    const nav = readSrc('../../components/Navbar.tsx');
    expect(nav).toMatch(/chat-topbar/);
    expect(nav).toMatch(/\bPlus\b/);
    expect(nav).toMatch(/<span>New<\/span>/);
    expect(nav).not.toMatch(/\bShare\b/);
    expect(nav).not.toMatch(/exportAsMarkdown/);
    expect(nav).not.toMatch(/Full history/);
    expect(nav).not.toMatch(/Generate title/);
    expect(nav).not.toMatch(/Hide sidebar/);
    expect(nav).not.toMatch(/['"]System['"]|>System</);
    expect(nav).not.toMatch(/['"]Tools['"]|>Tools</);
    expect(nav).not.toMatch(/New Conversation/);
    expect(nav).not.toMatch(/text-center/);
    expect(nav).not.toMatch(/RightPanelToggle/);
  });

  it('is mounted on the app shell so every page shows it from the start', () => {
    const root = readSrc('../../app/layout.tsx');
    const windowSrc = readSrc('../../components/ChatWindow.tsx');
    expect(root).toMatch(/Navbar/);
    expect(windowSrc).not.toMatch(/Navbar/);
  });

  it('shows Plus and Close on every page, including the agent picker', () => {
    const nav = readSrc('../../components/Navbar.tsx');
    const close = readSrc('../../components/CloseBackToItms.tsx');
    expect(nav).toMatch(/\bPlus\b/);
    expect(nav).not.toMatch(/pathname === '\/agents'/);
    expect(nav).not.toMatch(/onAgents/);
    expect(close).toMatch(/html-close-itms/);
    expect(close).not.toMatch(/pathname === '\/agents'/);
    expect(close).not.toMatch(/onAgents/);
    expect(close).not.toMatch(/return null/);
  });

  it('matches the 36px gray pi-web header chrome', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).toMatch(/--chat-topbar-height:\s*36px/);
    expect(css).toMatch(/--chat-topbar-bg:\s*#f5f5f5/);
    expect(css).toMatch(/--chat-topbar-hover:\s*#eeeeee/);
    const bar = cssRule(css, '.chat-topbar');
    expect(bar).toMatch(/position:\s*fixed/);
    expect(bar).toMatch(/top:\s*0/);
    expect(bar).toMatch(/height:\s*36px/);
    expect(bar).toMatch(/background:\s*var\(--chat-topbar-bg\)/);
    expect(bar).toMatch(/border-bottom:\s*1px solid var\(--chat-topbar-border\)/);
    expect(bar).toMatch(/padding-right:\s*72px/);

    const icon = cssRule(css, '.chat-topbar-icon');
    expect(icon).toMatch(/height:\s*100%/);
    expect(icon).toMatch(/padding:\s*0 12px/);
    expect(icon).toMatch(/font-size:\s*11px/);
    expect(icon).toMatch(/gap:\s*6px/);
    expect(icon).not.toMatch(/width:\s*36px/);
    expect(icon).not.toMatch(/border-left:/);
  });

  it('keeps the close hairline and a gray hover, without a white flash', () => {
    const css = readSrc('../../app/globals.css');
    const icon = cssRule(css, '.chat-topbar-icon');
    expect(icon).not.toMatch(/border-top:\s*2px/);

    const iconHover = cssRule(css, '.chat-topbar-icon:hover');
    expect(iconHover).toMatch(/background:\s*var\(--chat-topbar-hover\)/);
    expect(iconHover).not.toMatch(/border:\s*(0|none)/);
    expect(iconHover).not.toMatch(/border-top:\s*2px/);

    const closeHover = cssRule(
      css,
      '.right-panel-hide:hover,\n.right-panel-toggle:hover,\n.right-panel-toggle.is-open,\n.html-close-itms:hover',
    );
    expect(closeHover).toMatch(/border-left:\s*1px solid var\(--chat-topbar-border\)/);
    expect(closeHover).toMatch(/background:\s*var\(--chat-topbar-hover\)/);
    expect(closeHover).not.toMatch(/border:\s*(0|none)/);
  });
});
