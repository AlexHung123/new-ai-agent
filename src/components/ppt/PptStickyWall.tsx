'use client';

import { useState } from 'react';
import { listOutlinePages } from '@/lib/ppt/outline';
import type { PptDeckState, PptOutline } from '@/lib/ppt/types';

export function PptStickyWall({
  deck,
  onSelect,
  onOutlineChange,
}: {
  deck: PptDeckState;
  onSelect: (pageId: string) => void;
  onOutlineChange: (outline: PptOutline) => void;
}) {
  const outline = deck.outline;
  const [dragId, setDragId] = useState<string | null>(null);
  if (!outline) {
    return (
      <div className="ppt-stickies ppt-stickies-empty">
        确认需求后，这里会出现可拖拽的便利贴大纲。
      </div>
    );
  }

  const movePage = (pageId: string, targetPartId: string, beforeId?: string) => {
    const pages = listOutlinePages(outline).filter((p) => p.kind === 'content');
    const moving = pages.find((p) => p.page_id === pageId);
    if (!moving) return;
    const rest = pages.filter((p) => p.page_id !== pageId);
    const next: typeof rest = [];
    let inserted = false;
    for (const page of rest) {
      if (page.page_id === beforeId && page.part_id === targetPartId) {
        next.push({ ...moving, part_id: targetPartId });
        inserted = true;
      }
      next.push(page);
    }
    if (!inserted) {
      const lastInPart = [...rest].reverse().find((p) => p.part_id === targetPartId);
      if (lastInPart) {
        const idx = next.findIndex((p) => p.page_id === lastInPart.page_id);
        next.splice(idx + 1, 0, { ...moving, part_id: targetPartId });
      } else {
        next.push({ ...moving, part_id: targetPartId });
      }
    }
    const parts = outline.parts.map((part) => ({
      ...part,
      pages: next
        .filter((p) => p.part_id === part.part_id)
        .map((p) => ({ page_id: p.page_id, title: p.title, content: [] })),
    }));
    onOutlineChange({
      ...outline,
      parts,
      table_of_contents: {
        ...outline.table_of_contents,
        content: parts.map((part) => part.part_title),
      },
    });
  };

  const removePage = (pageId: string) => {
    const parts = outline.parts.map((part) => ({
      ...part,
      pages: part.pages.filter((p) => p.page_id !== pageId),
    }));
    if (parts.every((part) => part.pages.length === 0)) return;
    onOutlineChange({ ...outline, parts });
  };

  const addPage = (partId: string) => {
    onOutlineChange({
      ...outline,
      parts: outline.parts.map((part) =>
        part.part_id === partId
          ? {
              ...part,
              pages: [
                ...part.pages,
                { page_id: '', title: '新页面', content: [] },
              ],
            }
          : part,
      ),
    });
  };

  const rename = (pageId: string, title: string) => {
    if (pageId === 'p-cover') {
      onOutlineChange({ ...outline, cover: { ...outline.cover, title } });
      return;
    }
    if (pageId === 'p-end') {
      onOutlineChange({ ...outline, end_page: { ...outline.end_page, title } });
      return;
    }
    onOutlineChange({
      ...outline,
      parts: outline.parts.map((part) => ({
        ...part,
        part_title:
          `p-s-${String(outline.parts.indexOf(part) + 1).padStart(2, '0')}` ===
          pageId
            ? title
            : part.part_title,
        pages: part.pages.map((page) =>
          page.page_id === pageId ? { ...page, title } : page,
        ),
      })),
    });
  };

  return (
    <div className="ppt-stickies">
      <div className="ppt-sticky-col">
        <StickyNote
          id="p-cover"
          label="封面"
          title={outline.cover.title}
          selected={deck.selectedPageId === 'p-cover'}
          planned={Boolean(deck.pages['p-cover'])}
          onSelect={onSelect}
          onRename={rename}
          tone="pin"
        />
        <StickyNote
          id="p-toc"
          label="目录"
          title={outline.table_of_contents.title}
          selected={deck.selectedPageId === 'p-toc'}
          planned={Boolean(deck.pages['p-toc'])}
          onSelect={onSelect}
          onRename={(id, title) =>
            onOutlineChange({
              ...outline,
              table_of_contents: { ...outline.table_of_contents, title },
            })
          }
          tone="pin"
        />
        <StickyNote
          id="p-end"
          label="结尾"
          title={outline.end_page.title}
          selected={deck.selectedPageId === 'p-end'}
          planned={Boolean(deck.pages['p-end'])}
          onSelect={onSelect}
          onRename={rename}
          tone="pin"
        />
      </div>
      {outline.parts.map((part, index) => {
        const sectionId = `p-s-${String(index + 1).padStart(2, '0')}`;
        return (
          <div
            key={part.part_id}
            className="ppt-sticky-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) movePage(dragId, part.part_id);
              setDragId(null);
            }}
          >
            <StickyNote
              id={sectionId}
              label={`0${index + 1}`}
              title={part.part_title}
              selected={deck.selectedPageId === sectionId}
              planned={Boolean(deck.pages[sectionId])}
              onSelect={onSelect}
              onRename={(_id, title) =>
                onOutlineChange({
                  ...outline,
                  parts: outline.parts.map((item) =>
                    item.part_id === part.part_id
                      ? { ...item, part_title: title }
                      : item,
                  ),
                  table_of_contents: {
                    ...outline.table_of_contents,
                    content: outline.parts.map((item) =>
                      item.part_id === part.part_id ? title : item.part_title,
                    ),
                  },
                })
              }
              tone="section"
            />
            {part.pages.map((page) => (
              <StickyNote
                key={page.page_id}
                id={page.page_id}
                label={page.page_id}
                title={page.title}
                selected={deck.selectedPageId === page.page_id}
                planned={Boolean(deck.pages[page.page_id])}
                draggable
                onDragStart={() => setDragId(page.page_id)}
                onSelect={onSelect}
                onRename={rename}
                onRemove={() => removePage(page.page_id)}
                onDropBefore={(beforeId) => {
                  if (dragId) movePage(dragId, part.part_id, beforeId);
                  setDragId(null);
                }}
              />
            ))}
            <button
              type="button"
              className="ppt-sticky-add"
              onClick={() => addPage(part.part_id)}
            >
              + 加一页
            </button>
          </div>
        );
      })}
    </div>
  );
}

function StickyNote({
  id,
  label,
  title,
  selected,
  planned,
  tone,
  draggable,
  onSelect,
  onRename,
  onRemove,
  onDragStart,
  onDropBefore,
}: {
  id: string;
  label: string;
  title: string;
  selected: boolean;
  planned: boolean;
  tone?: 'pin' | 'section';
  draggable?: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onRemove?: () => void;
  onDragStart?: () => void;
  onDropBefore?: (id: string) => void;
}) {
  return (
    <div
      className={`ppt-sticky${selected ? ' is-selected' : ''}${tone ? ` is-${tone}` : ''}${planned ? ' is-planned' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        if (onDropBefore) e.preventDefault();
      }}
      onDrop={() => onDropBefore?.(id)}
      onClick={() => onSelect(id)}
    >
      <div className="ppt-sticky-label">{label}</div>
      <textarea
        value={title}
        rows={2}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onRename(id, e.target.value)}
      />
      {onRemove ? (
        <button
          type="button"
          className="ppt-sticky-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          撕掉
        </button>
      ) : null}
    </div>
  );
}
