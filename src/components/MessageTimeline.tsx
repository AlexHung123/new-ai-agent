'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildTimelineTurns } from '@/lib/chat/messageTimeline';
import { useChat } from '@/lib/hooks/useChat';

function formatIndex(n: number): string {
  return String(n).padStart(2, '0');
}

export default function MessageTimeline() {
  const { chatTurns } = useChat();
  const turns = useMemo(() => buildTimelineTurns(chatTurns), [chatTurns]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const openPreview = useCallback(
    (id?: string) => {
      clearLeaveTimer();
      setOpen(true);
      if (id) setHoveredId(id);
    },
    [clearLeaveTimer],
  );

  const scheduleClose = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      setOpen(false);
      setHoveredId(null);
    }, 160);
  }, [clearLeaveTimer]);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);

  const jumpToMessage = useCallback((messageId: string) => {
    const el = document.querySelector(
      `[data-message-id="${CSS.escape(messageId)}"]`,
    ) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.remove('is-flash');
    void el.offsetWidth;
    el.classList.add('is-flash');
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      el.classList.remove('is-flash');
      flashTimerRef.current = null;
    }, 1200);
  }, []);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (turns.length === 0) {
      setActiveId(null);
      return;
    }

    const ids = turns.map((t) => t.userMessageId);
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.messageId;
          if (!id) continue;
          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const id of ids) {
          const r = ratios.get(id) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            bestId = id;
          }
        }
        if (!bestId || bestRatio === 0) {
          for (const id of ids) {
            const el = document.querySelector(
              `[data-message-id="${CSS.escape(id)}"]`,
            );
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (rect.bottom > 40 && rect.top < window.innerHeight) {
              bestId = id;
              break;
            }
          }
        }
        if (bestId) setActiveId(bestId);
      },
      {
        root: null,
        rootMargin: '-10% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const id of ids) {
      const el = document.querySelector(`[data-message-id="${CSS.escape(id)}"]`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [turns, chatTurns]);

  useEffect(() => {
    if (!open) return;
    const focusId = hoveredId || activeId;
    if (!focusId || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-preview-id="${CSS.escape(focusId)}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, hoveredId, activeId]);

  if (turns.length === 0) return null;

  const focusId = hoveredId || activeId;

  return (
    <aside
      className={`message-outline${open ? ' is-open' : ''}`}
      aria-label="Conversation timeline"
      onMouseEnter={() => openPreview()}
      onMouseLeave={scheduleClose}
      onFocusCapture={() => openPreview()}
      onBlurCapture={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && e.currentTarget.contains(next)) return;
        scheduleClose();
      }}
    >
      <div className="message-outline-rail-track" aria-hidden />
      <ul className="message-outline-rail-list">
        {turns.map((turn) => {
          const isActive = turn.userMessageId === activeId;
          const isHovered = turn.userMessageId === hoveredId;
          return (
            <li key={turn.userMessageId}>
              <button
                type="button"
                className={`message-outline-dot${isActive ? ' is-active' : ''}${isHovered ? ' is-hovered' : ''}`}
                aria-label={`Jump to message ${formatIndex(turn.index)}: ${turn.userPreview}`}
                aria-current={isActive ? 'true' : undefined}
                onMouseEnter={() => openPreview(turn.userMessageId)}
                onFocus={() => openPreview(turn.userMessageId)}
                onClick={() => jumpToMessage(turn.userMessageId)}
              >
                <span className="message-outline-dot-inner" />
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className="message-outline-preview"
        role="tooltip"
        aria-hidden={!open}
        ref={listRef}
      >
        <ul className="message-outline-preview-list">
          {turns.map((turn) => {
            const isFocus = turn.userMessageId === focusId;
            return (
              <li key={turn.userMessageId}>
                <button
                  type="button"
                  data-preview-id={turn.userMessageId}
                  className={`message-outline-preview-entry${isFocus ? ' is-focus' : ''}`}
                  tabIndex={open ? 0 : -1}
                  onMouseEnter={() => setHoveredId(turn.userMessageId)}
                  onClick={() => jumpToMessage(turn.userMessageId)}
                >
                  <div className="message-outline-preview-head">
                    <span className="message-outline-preview-index">
                      {formatIndex(turn.index)}
                    </span>
                    <span className="message-outline-preview-user">
                      {turn.userPreview}
                    </span>
                  </div>
                  <div
                    className={`message-outline-preview-assistant${
                      turn.assistantPreview ? '' : ' is-empty'
                    }`}
                  >
                    <span className="message-outline-preview-a" aria-hidden>
                      A
                    </span>
                    <span className="message-outline-preview-assistant-text">
                      {turn.assistantPreview || 'Waiting for reply…'}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
