import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  clampRightPanelWidth,
  defaultRightPanelOpen,
  defaultRightPanelWidth,
  RIGHT_PANEL_DEFAULT_WIDTH,
  RIGHT_PANEL_MIN_WIDTH,
  usesRightPanel,
} from './rightPanel';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('usesRightPanel', () => {
  it('is only for Agent HTML and Agent Writing', () => {
    expect(usesRightPanel('agentHtml')).toBe(true);
    expect(usesRightPanel('agentWriting')).toBe(true);
    expect(usesRightPanel('agentDocument')).toBe(true);
    expect(usesRightPanel('agentKnowledge')).toBe(true);
    expect(usesRightPanel('agentSFC')).toBe(false);
    expect(usesRightPanel('newSurveyAgent')).toBe(false);
    expect(usesRightPanel('agentVoice')).toBe(false);
    expect(usesRightPanel('')).toBe(false);
  });
});

describe('defaultRightPanelOpen', () => {
  it('opens the HTML canvas by default for Agent HTML', () => {
    expect(defaultRightPanelOpen('agentHtml')).toBe(true);
    expect(defaultRightPanelOpen('agentWriting')).toBe(false);
    expect(defaultRightPanelOpen('agentDocument')).toBe(false);
    expect(defaultRightPanelOpen('')).toBe(false);
  });
});

describe('right panel width', () => {
  it('clamps to the min width and leaves room for chat', () => {
    expect(clampRightPanelWidth(100, 1600)).toBe(RIGHT_PANEL_MIN_WIDTH);
    expect(clampRightPanelWidth(2000, 1600)).toBe(1600 - 420);
    expect(defaultRightPanelWidth(1800)).toBe(600);
    expect(defaultRightPanelWidth(1600)).toBe(533);
    expect(defaultRightPanelWidth(600)).toBe(RIGHT_PANEL_MIN_WIDTH);
  });

  it('falls back to the default when the stored value is not a number', () => {
    expect(clampRightPanelWidth(Number.NaN, 1400)).toBe(
      Math.min(RIGHT_PANEL_DEFAULT_WIDTH, 1400 - 420),
    );
  });
});

describe('right panel layout contract', () => {
  it('docks the HTML canvas inside a resizable right panel', () => {
    const windowSrc = readSrc('../../components/ChatWindow.tsx');
    const panel = readSrc('../../components/ChatRightPanel.tsx');
    const canvas = readSrc('../../components/HtmlCanvas.tsx');
    const empty = readSrc('../../components/EmptyChat.tsx');
    expect(windowSrc).toMatch(/ChatRightPanel/);
    expect(windowSrc).toMatch(/chat-workspace/);
    expect(panel).toMatch(/usesRightPanel/);
    expect(panel).toMatch(/right-panel-container/);
    expect(panel).toMatch(/panel-resize-handle/);
    expect(readSrc('../../components/RightPanelContext.tsx')).toMatch(
      /Hide panel/,
    );
    expect(canvas).toMatch(/html-canvas-tab/);
    expect(canvas).toMatch(/Source/);
    expect(canvas).toMatch(/Preview/);
    expect(empty).not.toMatch(/HtmlCanvas/);
  });

  it('keeps the writing preview panel for HTML explainer pages', () => {
    const panel = readSrc('../../components/ChatRightPanel.tsx');
    const preview = readSrc('../../components/WritingPreviewPanel.tsx');
    const box = readSrc('../../components/MessageBox.tsx');
    expect(panel).toMatch(/WritingPreviewPanel/);
    expect(panel).not.toMatch(/DocumentPreviewPanel/);
    expect(preview).toMatch(/Select a file to preview/);
    expect(preview).toMatch(/Source/);
    expect(preview).toMatch(/Preview/);
    expect(preview).toMatch(/PreviewTabBar/);
    expect(preview).toMatch(/file-viewer-toolbar/);
    expect(preview).toMatch(/file-viewer-mode-switch/);
    expect(readSrc('../../components/RightPanelContext.tsx')).toMatch(
      /shouldHidePanel/,
    );
    expect(box).toMatch(/isKnowledgeFocusMode\(focusMode\)/);
    expect(box).toMatch(/Open HTML page/);
    expect(readSrc('../../components/WritingLeftRail.tsx')).not.toMatch(
      /openWritingFile/,
    );
    expect(readSrc('../../components/RightPanelContext.tsx')).toMatch(
      /openKnowledgeFile/,
    );
    expect(readSrc('../../components/WritingPreviewPanel.tsx')).toMatch(
      /\/api\/knowledge\/files\//,
    );
  });

  it('styles Close and panel expand as header-bar icons', () => {
    const nav = readSrc('../../components/Navbar.tsx');
    const empty = readSrc('../../components/EmptyChat.tsx');
    const panel = readSrc('../../components/ChatRightPanel.tsx');
    const canvas = readSrc('../../components/HtmlCanvas.tsx');
    const preview = readSrc('../../components/WritingPreviewPanel.tsx');
    const css = readFileSync(
      path.join(process.cwd(), 'src', 'app', 'globals.css'),
      'utf8',
    );

    expect(empty).not.toMatch(/RightPanelToggle/);
    expect(nav).not.toMatch(/RightPanelToggle/);
    expect(panel).not.toMatch(/workspace-panel-chrome/);
    expect(css).toMatch(/\.workspace-panel-chrome \{[^}]*top:\s*0/);
    expect(css).toMatch(/\.workspace-panel-chrome \{[^}]*right:\s*0/);
    expect(css).toMatch(
      /\.workspace-panel-chrome [^{]*\{[^}]*border-radius:\s*0/,
    );
    expect(css).not.toMatch(/\.right-panel-expand \{[^}]*top:\s*4\.5rem/);
    expect(canvas).not.toMatch(/RightPanelHideButton/);
    expect(preview).not.toMatch(/RightPanelHideButton/);
  });

  it('shows Close on every agent, not only Agent HTML', () => {
    const close = readSrc('../../components/CloseBackToItms.tsx');
    const layout = readSrc('../../app/layout.tsx');
    const chrome = readSrc('../../components/WorkspaceChrome.tsx');
    expect(close).not.toMatch(/agentHtml/);
    expect(close).toMatch(/window\.parent !== window/);
    expect(close).not.toMatch(/pathname === '\/agents'/);
    expect(close).not.toMatch(/return null/);
    expect(layout).toMatch(/WorkspaceChrome/);
    expect(layout).toMatch(/RightPanelProvider/);
    expect(chrome).toMatch(/CloseBackToItms/);
    expect(chrome).toMatch(/RightPanelToggle/);
    expect(chrome).toMatch(/workspace-panel-chrome/);
  });

  it('opens the panel when entering Agent HTML even if it was hidden', () => {
    const context = readSrc('../../components/RightPanelContext.tsx');
    expect(context).toMatch(/defaultRightPanelOpen/);
    expect(context).toMatch(/setOpenState\(true\)/);
  });

  it('keeps the writing left rail when the right panel is open', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).not.toMatch(
      /\.chat-workspace:has\(\.right-panel-open\) \.writing-left-rail \.agent-card\s*\{[^}]*display:\s*none/,
    );
    expect(css).not.toMatch(
      /\.chat-workspace:has\(\.right-panel-open\) \.writing-left-rail:has\(\.writing-file-browser\)\s*\{[^}]*width:\s*280px/,
    );
    expect(css).not.toMatch(
      /\.chat-workspace:has\(\.right-panel-open\) \.writing-left-rail\s*\{[^}]*display:\s*none/,
    );
    expect(css).not.toMatch(/writing-file-browser/);
  });

  it('does not pad chat for a Writing FILES rail', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).not.toMatch(
      /\.chat-workspace:has\(\.right-panel-open\) \.empty-chat-body \{[^}]*padding-left:\s*20rem/,
    );
    expect(css).not.toMatch(/writing-file-browser/);
  });
});
