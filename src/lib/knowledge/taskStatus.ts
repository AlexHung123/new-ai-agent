export type IngestBadge = 'indexing' | 'embedding' | 'failed' | null;

export function ingestBadge(
  task:
    | { status: string; stage?: string | null }
    | null
    | undefined,
): IngestBadge {
  if (!task) return null;
  if (task.status === 'failed') return 'failed';
  if (task.status === 'succeeded') return null;
  if (task.stage === 'qmd_embed') return 'embedding';
  return 'indexing';
}
