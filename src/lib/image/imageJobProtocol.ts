import type { ComfyJobPhase } from './comfyClient';

export const IMAGE_POLL_MS = 2000;

export function isTerminalImageStatus(status: string): boolean {
  return (
    status === 'succeeded' || status === 'failed' || status === 'cancelled'
  );
}

export function imagePhaseLabel(status: string): string {
  if (status === 'queued') return 'Queued';
  if (status === 'generating') return 'Generating…';
  if (status === 'succeeded') return 'Done';
  if (status === 'failed') return 'Failed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Generating…';
}

export function canvasPhaseLabel(status: string | null): string {
  if (!status) return 'Waiting for input';
  if (status === 'queued') return 'Queued';
  if (status === 'generating') return 'Generating…';
  return 'Waiting for input';
}

export type ImageJobView = {
  jobId: string;
  status: ComfyJobPhase;
  prompt?: string;
  error?: string | null;
  imageUrl?: string | null;
};
