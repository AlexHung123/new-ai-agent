'use client';

import FileTypeIcon from './FileTypeIcon';
import type { PreviewTab } from '@/lib/chat/writingPreviewTabs';

type Props = {
  tabs: PreviewTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
};

/** Tab strip ported from pi-web `components/TabBar.tsx`. */
export default function PreviewTabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: Props) {
  return (
    <div className="preview-tab-bar" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-label={tab.label}
            aria-selected={isActive}
            tabIndex={isActive || (!activeTabId && tabs[0]?.id === tab.id) ? 0 : -1}
            className={`preview-tab${isActive ? ' is-active' : ''}`}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectTab(tab.id);
              } else if (
                ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              ) {
                event.preventDefault();
                const index = tabs.findIndex((item) => item.id === tab.id);
                const nextIndex =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? tabs.length - 1
                      : (index +
                          (event.key === 'ArrowRight' ? 1 : -1) +
                          tabs.length) %
                        tabs.length;
                onSelectTab(tabs[nextIndex].id);
                (
                  event.currentTarget.parentElement?.children[
                    nextIndex
                  ] as HTMLElement | undefined
                )?.focus();
              }
            }}
            onClick={() => onSelectTab(tab.id)}
            onMouseDown={(event) => {
              if (event.button === 1) event.preventDefault();
            }}
            onAuxClick={(event) => {
              if (event.button !== 1) return;
              event.preventDefault();
              event.stopPropagation();
              onCloseTab(tab.id);
            }}
          >
            <span className="preview-tab-icon">
              <FileTypeIcon
                name={tab.kind === 'html' ? 'page.html' : tab.label}
                size={13}
              />
            </span>
            <span className="preview-tab-label" title={tab.label}>
              {tab.label}
            </span>
            <button
              type="button"
              className="preview-tab-close"
              title="Close"
              aria-label={`Close ${tab.label}`}
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="2" y1="2" x2="8" y2="8" />
                <line x1="8" y1="2" x2="2" y2="8" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
