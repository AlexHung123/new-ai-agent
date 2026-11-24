import { getAdminUserIds, isAdminUserId } from '@/lib/auth/isAdminUser';
import configManager from '@/lib/config';

/**
 * Who may create or upload into the shared public Knowledge library.
 *
 * v1 allowlist, not a full IAM system:
 * - `adminUserIds` in config (existing admins)
 * - `knowledge.publicCurators` or `dochub.publicCurators` (string[])
 * - `KNOWLEDGE_PUBLIC_CURATORS` env (comma-separated user ids)
 *
 * Dochub also enforces `DOCHUB_PUBLIC_CURATORS` on the Mac. Keep that list
 * in sync with this allowlist or public writes will 403 at Dochub.
 */
export function parseCuratorIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function getPublicCuratorIds(): string[] {
  const fromKnowledge = parseCuratorIds(
    configManager.getConfig('knowledge.publicCurators', undefined),
  );
  const fromDochub = parseCuratorIds(
    configManager.getConfig('dochub.publicCurators', undefined),
  );
  const fromEnv = parseCuratorIds(process.env.KNOWLEDGE_PUBLIC_CURATORS);
  return Array.from(new Set([...fromKnowledge, ...fromDochub, ...fromEnv]));
}

export function canWritePublicLibrary(
  userId: string | number | null | undefined,
  opts?: {
    adminUserIds?: readonly string[];
    curatorIds?: readonly string[];
  },
): boolean {
  if (userId == null || !String(userId).trim()) return false;
  const id = String(userId).trim();
  const admins = opts?.adminUserIds ?? getAdminUserIds();
  const curators = opts?.curatorIds ?? getPublicCuratorIds();
  return isAdminUserId(id, admins) || curators.includes(id);
}
