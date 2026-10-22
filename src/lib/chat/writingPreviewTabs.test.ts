import { describe, expect, it } from 'vitest';
import {
  activeTabAfterClose,
  closePreviewTab,
  htmlPageTabId,
  openPreviewTab,
  shouldHidePanel,
  writingFileTabId,
  type PreviewTab,
} from './writingPreviewTabs';

const report: PreviewTab = {
  id: writingFileTabId('file-a'),
  label: 'Weekly report.docx',
  kind: 'file',
  fileId: 'file-a',
};

const agents: PreviewTab = {
  id: writingFileTabId('file-b'),
  label: 'AGENTS.md',
  kind: 'file',
  fileId: 'file-b',
};

describe('writing preview tabs', () => {
  it('opens a document as a new tab', () => {
    const tabs = openPreviewTab([], report);
    expect(tabs).toEqual([report]);
    expect(shouldHidePanel(tabs)).toBe(false);
  });

  it('keeps one tab when the same document is opened again', () => {
    const once = openPreviewTab([], report);
    const twice = openPreviewTab(once, report);
    expect(twice).toBe(once);
    expect(twice).toHaveLength(1);
  });

  it('adds a second document without dropping the first', () => {
    const tabs = openPreviewTab(openPreviewTab([], report), agents);
    expect(tabs.map((tab) => tab.fileId)).toEqual(['file-a', 'file-b']);
  });

  it('refreshes the label when the same document is opened with a name', () => {
    const untitled = { ...report, label: 'file-a' };
    const tabs = openPreviewTab(openPreviewTab([], untitled), report);
    expect(tabs).toEqual([report]);
  });

  it('leaves the active tab alone when a background tab closes', () => {
    const tabs = [report, agents];
    expect(activeTabAfterClose(tabs, report.id, agents.id)).toBe(agents.id);
    expect(closePreviewTab(tabs, report.id)).toEqual([agents]);
    expect(shouldHidePanel(closePreviewTab(tabs, report.id))).toBe(false);
  });

  it('selects the last remaining tab when the active document closes', () => {
    const html: PreviewTab = {
      id: htmlPageTabId('page-1'),
      label: 'HTML page',
      kind: 'html',
      pageId: 'page-1',
    };
    const tabs = [report, agents, html];
    expect(activeTabAfterClose(tabs, html.id, html.id)).toBe(agents.id);
  });

  it('hides the panel when the last document tab closes', () => {
    const next = closePreviewTab([report], report.id);
    expect(next).toEqual([]);
    expect(activeTabAfterClose([report], report.id, report.id)).toBeNull();
    expect(shouldHidePanel(next)).toBe(true);
  });
});
