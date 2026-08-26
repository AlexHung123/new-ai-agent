import type { AdminChatListItem } from './adminChatList';

export type CapUserDpIdRow = {
  id: number | string;
  dp_id: string | null;
};

export function uniqueNumericUserIds(userIds: readonly string[]): number[] {
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const raw of userIds) {
    const n = Number.parseInt(String(raw).trim(), 10);
    if (!Number.isFinite(n) || seen.has(n)) {
      continue;
    }
    seen.add(n);
    ids.push(n);
  }
  return ids;
}

export function capUserDpIdSql(ids: readonly number[]): {
  sql: string;
  params: number[];
} {
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
  return {
    sql: `SELECT id, dp_id FROM cap_user WHERE id IN (${placeholders})`,
    params: [...ids],
  };
}

export function toDpIdByUserId(
  rows: readonly CapUserDpIdRow[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    const id = String(row.id).trim();
    const dpId = row.dp_id == null ? '' : String(row.dp_id).trim();
    if (id && dpId) {
      map[id] = dpId;
    }
  }
  return map;
}

export function attachDpIds(
  items: AdminChatListItem[],
  dpIdByUserId: Record<string, string>,
): AdminChatListItem[] {
  return items.map((item) => {
    const dpId = dpIdByUserId[item.userId];
    return dpId ? { ...item, dpId } : item;
  });
}

export async function fetchDpIdByUserId(
  userIds: readonly string[],
): Promise<Record<string, string>> {
  const ids = uniqueNumericUserIds(userIds);
  if (ids.length === 0) {
    return {};
  }

  const { sql, params } = capUserDpIdSql(ids);
  const { prismaSecondary } = await import('@/lib/postgres/db');
  const rows = await prismaSecondary.$queryRawUnsafe<CapUserDpIdRow[]>(
    sql,
    ...params,
  );
  return toDpIdByUserId(rows);
}
