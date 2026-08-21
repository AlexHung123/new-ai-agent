import configManager from '@/lib/config';

export function normalizeAdminUserIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0);
}

export function isAdminUserId(
  userId: string | number | null | undefined,
  adminUserIds: readonly string[],
): boolean {
  if (userId == null) {
    return false;
  }

  const id = String(userId).trim();
  if (!id) {
    return false;
  }

  return adminUserIds.includes(id);
}

export function getAdminUserIds(): string[] {
  return normalizeAdminUserIds(configManager.getConfig('adminUserIds', []));
}

export function isAdminUser(
  userId: string | number | null | undefined,
): boolean {
  return isAdminUserId(userId, getAdminUserIds());
}

export function requireAdmin(
  userId: string | number | null | undefined,
  adminUserIds: readonly string[] = getAdminUserIds(),
): Response | null {
  if (userId == null || !String(userId).trim()) {
    return Response.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }

  if (!isAdminUserId(userId, adminUserIds)) {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  return null;
}
