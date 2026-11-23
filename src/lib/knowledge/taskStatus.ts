export type IngestBadge = 'indexing' | 'embedding' | 'failed' | null;

export function ingestBadge(
  task:
    | { status: string; stage?: string | null }
    | null
    | undefined,
): IngestBadge {
  if (!task) return null;
  if (task.status === 'failed') return 'failed';
  if (task.status === 'succeeded' || task.status === 'timed_out') return null;
  if (task.stage === 'qmd_embed') return 'embedding';
  return 'indexing';
}

export function parseLabel(
  task:
    | { status: string; stage?: string | null }
    | null
    | undefined,
): 'Indexing' | 'Embedding' | 'Failed' | 'done' {
  const badge = ingestBadge(task);
  if (badge === 'indexing') return 'Indexing';
  if (badge === 'embedding') return 'Embedding';
  if (badge === 'failed') return 'Failed';
  return 'done';
}
