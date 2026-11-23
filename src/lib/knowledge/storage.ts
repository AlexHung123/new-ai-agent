import type { KnowledgeTreeNode } from './types';
import { usedBytesFromTree } from './tree';

/** Default total storage per user: 5 GiB (same as pi-rag). */
export const DEFAULT_MAX_USER_BYTES = 5 * 1024 * 1024 * 1024;

const AVATAR_COLORS = [
  '#ea580c',
  '#2563eb',
  '#db2777',
  '#059669',
  '#7c3aed',
  '#d97706',
  '#0891b2',
  '#4f46e5',
];

export type KnowledgeStorageUsage = {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  usageRatio: number;
};

export function formatStorageBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function quotaForUser(
  userId: string,
  maxUserBytes: number,
  userQuotaBytes?: Record<string, number>,
): number {
  const override = userQuotaBytes?.[userId];
  if (typeof override === 'number' && Number.isFinite(override) && override >= 0) {
    return Math.floor(override);
  }
  return maxUserBytes;
}

export function storageUsage(
  usedBytes: number,
  quotaBytes: number,
): KnowledgeStorageUsage {
  const used = Math.max(0, usedBytes);
  const quota = Math.max(0, quotaBytes);
  const remainingBytes = Math.max(0, quota - used);
  const usageRatio = quota > 0 ? used / quota : used > 0 ? 1 : 0;
  return { usedBytes: used, quotaBytes: quota, remainingBytes, usageRatio };
}

export function storageForTree(
  tree: KnowledgeTreeNode,
  quotaBytes: number,
): KnowledgeStorageUsage {
  return storageUsage(usedBytesFromTree(tree), quotaBytes);
}

export function wouldExceedQuota(
  usage: KnowledgeStorageUsage,
  additionalBytes: number,
): boolean {
  const need = Math.max(0, additionalBytes);
  return usage.usedBytes + need > usage.quotaBytes;
}

export function quotaExceededMessage(
  usage: KnowledgeStorageUsage,
  need: number,
): string {
  return (
    `Storage quota exceeded. Used ${formatStorageBytes(usage.usedBytes)} / ${formatStorageBytes(usage.quotaBytes)}. ` +
    `This file needs ${formatStorageBytes(need)} (${formatStorageBytes(usage.remainingBytes)} free).`
  );
}

export function folderAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function folderInitial(name: string): string {
  return (name.trim().charAt(0) || 'F').toUpperCase();
}

export function formatKnowledgeDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
