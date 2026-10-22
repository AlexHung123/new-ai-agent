'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from '@/lib/hooks/useChat';
import {
  defaultRightPanelOpen,
  RIGHT_PANEL_OPEN_STORAGE_KEY,
  usesRightPanel,
} from '@/lib/chat/rightPanel';
import {
  activeTabAfterClose,
  closePreviewTab as removePreviewTab,
  htmlPageTabId,
  openPreviewTab,
  shouldHidePanel,
  writingFileTabId,
  type PreviewTab,
} from '@/lib/chat/writingPreviewTabs';

type RightPanelContextValue = {
  enabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  activeHtmlPageId: string | null;
  openHtmlPage: (id: string) => void;
  previewTabs: PreviewTab[];
  activePreviewTabId: string | null;
  selectPreviewTab: (id: string) => void;
  closePreviewTab: (id: string) => void;
  openWritingFile: (id: string, label?: string) => void;
};

const RightPanelContext = createContext<RightPanelContextValue>({
  enabled: false,
  open: false,
  setOpen: () => {},
  toggle: () => {},
  activeHtmlPageId: null,
  openHtmlPage: () => {},
  previewTabs: [],
  activePreviewTabId: null,
  selectPreviewTab: () => {},
  closePreviewTab: () => {},
  openWritingFile: () => {},
});

export function useRightPanel() {
  return useContext(RightPanelContext);
}

function persistOpen(open: boolean) {
  try {
    window.localStorage.setItem(RIGHT_PANEL_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const { focusMode } = useChat();
  const enabled = usesRightPanel(focusMode);
  const [open, setOpenState] = useState(true);
  const [activeHtmlPageId, setActiveHtmlPageId] = useState<string | null>(null);
  const [previewTabs, setPreviewTabs] = useState<PreviewTab[]>([]);
  const [activePreviewTabId, setActivePreviewTabId] = useState<string | null>(
    null,
  );
  const previewTabsRef = useRef(previewTabs);
  const activePreviewTabIdRef = useRef(activePreviewTabId);
  previewTabsRef.current = previewTabs;
  activePreviewTabIdRef.current = activePreviewTabId;

  useEffect(() => {
    if (defaultRightPanelOpen(focusMode)) {
      setOpenState(true);
      return;
    }
    if (focusMode === 'agentWriting') {
      if (shouldHidePanel(previewTabsRef.current)) setOpenState(false);
      return;
    }
    try {
      const stored = window.localStorage.getItem(RIGHT_PANEL_OPEN_STORAGE_KEY);
      if (stored === '0') setOpenState(false);
      if (stored === '1') setOpenState(true);
    } catch {
      /* ignore */
    }
  }, [focusMode]);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    persistOpen(next);
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      persistOpen(next);
      return next;
    });
  }, []);

  const showPanel = useCallback(() => {
    setOpenState(true);
    persistOpen(true);
  }, []);

  const openHtmlPage = useCallback(
    (id: string) => {
      const pageId = id.trim();
      if (!pageId) return;
      const tab: PreviewTab = {
        id: htmlPageTabId(pageId),
        label: 'HTML page',
        kind: 'html',
        pageId,
      };
      const next = openPreviewTab(previewTabsRef.current, tab);
      previewTabsRef.current = next;
      activePreviewTabIdRef.current = tab.id;
      setPreviewTabs(next);
      setActivePreviewTabId(tab.id);
      setActiveHtmlPageId(pageId);
      showPanel();
    },
    [showPanel],
  );

  const openWritingFile = useCallback(
    (id: string, label?: string) => {
      const fileId = id.trim();
      if (!fileId) return;
      const tab: PreviewTab = {
        id: writingFileTabId(fileId),
        label: label?.trim() || fileId,
        kind: 'file',
        fileId,
      };
      const next = openPreviewTab(previewTabsRef.current, tab);
      previewTabsRef.current = next;
      activePreviewTabIdRef.current = tab.id;
      setPreviewTabs(next);
      setActivePreviewTabId(tab.id);
      showPanel();
    },
    [showPanel],
  );

  const selectPreviewTab = useCallback((id: string) => {
    activePreviewTabIdRef.current = id;
    setActivePreviewTabId(id);
    const tab = previewTabsRef.current.find((item) => item.id === id);
    if (tab?.kind === 'html' && tab.pageId) setActiveHtmlPageId(tab.pageId);
  }, []);

  const closePreviewTab = useCallback((id: string) => {
    const prev = previewTabsRef.current;
    const next = removePreviewTab(prev, id);
    const activeId = activeTabAfterClose(
      prev,
      id,
      activePreviewTabIdRef.current,
    );
    previewTabsRef.current = next;
    activePreviewTabIdRef.current = activeId;
    setPreviewTabs(next);
    setActivePreviewTabId(activeId);
    const active = next.find((tab) => tab.id === activeId);
    setActiveHtmlPageId(active?.kind === 'html' ? active.pageId ?? null : null);
    if (shouldHidePanel(next)) {
      setOpenState(false);
      persistOpen(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      open,
      setOpen,
      toggle,
      activeHtmlPageId,
      openHtmlPage,
      previewTabs,
      activePreviewTabId,
      selectPreviewTab,
      closePreviewTab,
      openWritingFile,
    }),
    [
      activeHtmlPageId,
      activePreviewTabId,
      closePreviewTab,
      enabled,
      open,
      openHtmlPage,
      openWritingFile,
      previewTabs,
      selectPreviewTab,
      setOpen,
      toggle,
    ],
  );

  return (
    <RightPanelContext.Provider value={value}>
      {children}
    </RightPanelContext.Provider>
  );
}

function PanelIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

export function RightPanelToggle({ className }: { className?: string }) {
  const { enabled, open, toggle } = useRightPanel();
  const pathname = usePathname();
  const onChat = pathname === '/' || pathname.startsWith('/c/');
  if (!enabled || !onChat) return null;
  return (
    <button
      type="button"
      className={`right-panel-toggle${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      onClick={toggle}
      aria-controls="file-panel"
      aria-expanded={open}
      title={open ? 'Hide panel' : 'Show panel'}
      aria-label={open ? 'Hide panel' : 'Show panel'}
    >
      <PanelIcon />
    </button>
  );
}

export function RightPanelHideButton() {
  const { open, setOpen } = useRightPanel();
  return (
    <button
      type="button"
      className="right-panel-hide"
      onClick={() => setOpen(false)}
      aria-controls="file-panel"
      aria-expanded={open}
      title="Hide panel"
      aria-label="Hide panel"
    >
      <PanelIcon />
    </button>
  );
}
