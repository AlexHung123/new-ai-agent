import { displayFilename } from '@/lib/writing/types';

const MAX_SEGMENT = 200;
const MAX_PATH = 500;

export function sanitizePathSegment(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (trimmed === '.' || trimmed === '..') return null;
  if (trimmed.length > MAX_SEGMENT) return null;
  if (/[/\\]/.test(trimmed)) return null;
  if (/[\u0000-\u001f]/.test(trimmed)) return null;
  return trimmed;
}

export function joinKnowledgePath(parent: string, name: string): string {
  if (!parent) return name;
  if (!name) return parent;
  return `${parent}/${name}`;
}

export function isSafeRelativePath(path: string): boolean {
  if (typeof path !== 'string' || !path || path.length > MAX_PATH) return false;
  if (path.startsWith('/') || path.includes('\\')) return false;
  const parts = path.split('/');
  return parts.every((part) => sanitizePathSegment(part) === part);
}

export function buildRelativePath(folderPath: string, filename: string): string {
  const base = displayFilename(filename);
  if (folderPath && !isSafeRelativePath(folderPath)) {
    return base;
  }
  return joinKnowledgePath(folderPath, base);
}

export function markdownName(filename: string): string {
  const base = displayFilename(filename);
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return `${base}.md`;
  return `${base.slice(0, dot)}.md`;
}
