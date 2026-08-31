'use client';

import { Fragment, type ReactNode } from 'react';
import { findPageCitations } from '@/lib/reading/pageCitations';

export function PageCiteButton({
  page,
  children,
  onJump,
}: {
  page: number;
  children: ReactNode;
  onJump?: (page: number) => void;
}) {
  return (
    <button
      type="button"
      className="reader-page-cite"
      onClick={() => onJump?.(page)}
      title={`Go to page ${page}`}
    >
      {children}
    </button>
  );
}

export function PageCiteText({
  text,
  onJump,
}: {
  text: string;
  onJump?: (page: number) => void;
}) {
  const cites = onJump ? findPageCitations(text) : [];
  if (cites.length === 0) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  cites.forEach((cite, i) => {
    if (cite.start > cursor) {
      parts.push(
        <Fragment key={`t-${i}`}>{text.slice(cursor, cite.start)}</Fragment>,
      );
    }
    parts.push(
      <PageCiteButton key={`p-${i}`} page={cite.page} onJump={onJump}>
        {cite.text}
      </PageCiteButton>,
    );
    cursor = cite.end;
  });
  if (cursor < text.length) {
    parts.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>);
  }
  return <>{parts}</>;
}
