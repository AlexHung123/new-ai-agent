'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  clampRightPanelWidth,
  defaultRightPanelWidth,
  RIGHT_PANEL_DEFAULT_WIDTH,
  RIGHT_PANEL_WIDTH_STORAGE_KEY,
} from './rightPanel';

export function useRightPanelResize() {
  const panelRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(RIGHT_PANEL_DEFAULT_WIDTH);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [width, setWidth] = useState(RIGHT_PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const commit = useCallback((candidate: number) => {
    const vw = typeof window === 'undefined' ? 1400 : window.innerWidth;
    const next = clampRightPanelWidth(candidate, vw);
    widthRef.current = next;
    setWidth(next);
    panelRef.current?.style.setProperty('--right-panel-width', `${next}px`);
    try {
      window.localStorage.setItem(RIGHT_PANEL_WIDTH_STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
    return next;
  }, []);

  useEffect(() => {
    let stored: number | null = null;
    try {
      const raw = window.localStorage.getItem(RIGHT_PANEL_WIDTH_STORAGE_KEY);
      if (raw !== null) {
        const parsed = Number.parseInt(raw, 10);
        if (Number.isFinite(parsed)) stored = parsed;
      }
    } catch {
      /* ignore */
    }
    const vw = window.innerWidth;
    commit(stored ?? defaultRightPanelWidth(vw));
  }, [commit]);

  useEffect(() => {
    const onResize = () => {
      commit(widthRef.current);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [commit]);

  const finish = useCallback(
    (pointerId: number) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== pointerId) return;
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setIsResizing(false);
      commit(widthRef.current);
    },
    [commit],
  );

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: widthRef.current,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    setIsResizing(true);
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      finish(event.pointerId);
      return;
    }
    event.preventDefault();
    const next = clampRightPanelWidth(
      drag.startWidth + (drag.startX - event.clientX),
      window.innerWidth,
    );
    widthRef.current = next;
    panelRef.current?.style.setProperty('--right-panel-width', `${next}px`);
  }, [finish]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        commit(widthRef.current + 12);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        commit(widthRef.current - 12);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        commit(defaultRightPanelWidth(window.innerWidth));
      }
    },
    [commit],
  );

  return {
    panelRef,
    width,
    isResizing,
    separatorProps: {
      'aria-label': 'Resize panel',
      'aria-orientation': 'vertical' as const,
      'aria-valuenow': width,
      'aria-valuetext': `${width} px`,
      onDoubleClick: () => commit(defaultRightPanelWidth(window.innerWidth)),
      onKeyDown,
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) =>
        finish(event.pointerId),
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) =>
        finish(event.pointerId),
      role: 'separator' as const,
      tabIndex: 0,
    },
  };
}
