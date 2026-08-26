import type { AdminChatListItem } from './adminChatList';

export type AdminChatQuery = {
  q: string;
  page: number;
  pageSize: number;
};

export type AdminChatPage = {
  chats: AdminChatListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(raw: string | null | undefined, fallback: number): number {
  if (raw == null || raw.trim() === '') {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return fallback;
  }
  return n;
}

export function parseAdminChatQuery(input: {
  q?: string | null;
  page?: string | null;
  pageSize?: string | null;
}): AdminChatQuery {
  const q = (input.q ?? '').trim();
  const page = parsePositiveInt(input.page, 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    parsePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE),
  );
  return { q, page, pageSize };
}

export function matchesAdminChatQuery(
  item: AdminChatListItem,
  q: string,
  agentTitleByFocusMode: Record<string, string>,
): boolean {
  if (!q) {
    return true;
  }

  const needle = q.toLowerCase();
  const haystacks = [
    item.title,
    item.userId,
    item.dpId ?? '',
    item.focusMode,
    agentTitleByFocusMode[item.focusMode] ?? '',
  ];

  return haystacks.some((value) => value.toLowerCase().includes(needle));
}

export function paginateAdminChats(
  items: AdminChatListItem[],
  query: AdminChatQuery,
  agentTitleByFocusMode: Record<string, string>,
): AdminChatPage {
  const filtered = items.filter((item) =>
    matchesAdminChatQuery(item, query.q, agentTitleByFocusMode),
  );
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;
  const chats = filtered.slice(start, start + query.pageSize);

  return {
    chats,
    total,
    page,
    pageSize: query.pageSize,
    pageCount,
  };
}
