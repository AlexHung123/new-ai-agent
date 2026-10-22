'use client';

import type { CSSProperties } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { usesRightPanel } from '@/lib/chat/rightPanel';
import { useRightPanelResize } from '@/lib/chat/useRightPanelResize';
import { useRightPanel } from './RightPanelContext';
import HtmlCanvas from './HtmlCanvas';
import WritingPreviewPanel from './WritingPreviewPanel';

export default function ChatRightPanel() {
  const { focusMode } = useChat();
  const { enabled, open } = useRightPanel();
  const { panelRef, isResizing, separatorProps, width } = useRightPanelResize();

  if (!enabled || !usesRightPanel(focusMode)) return null;

  return (
    <>
      {open ? (
        <div
          {...separatorProps}
          className={`panel-resize-handle${isResizing ? ' is-resizing' : ''}`}
          data-resize-handle="right-panel"
          title="Drag to resize. Double-click to reset."
        />
      ) : null}
      <div
        ref={panelRef}
        id="file-panel"
        className={`right-panel-container${open ? ' right-panel-open' : ' right-panel-closed'}${isResizing ? ' right-panel-resizing' : ''}`}
        style={
          {
            '--right-panel-width': `${width}px`,
          } as CSSProperties
        }
      >
        <div className="right-panel-inner">
          <div className="right-panel-body">
            {focusMode === 'agentHtml' ? (
              <HtmlCanvas />
            ) : (
              <WritingPreviewPanel />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
