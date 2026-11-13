import type { ComfyImageRef, ComfyJobPhase } from './comfyClient';

export type OwnedImageJob = {
  userId: string;
  prompt: string;
  createdAt: number;
  status: ComfyJobPhase;
  images: ComfyImageRef[];
  error?: string | null;
};

const globalJobs = globalThis as typeof globalThis & {
  __imageComfyJobs?: Map<string, OwnedImageJob>;
};

function imageJobs(): Map<string, OwnedImageJob> {
  if (!globalJobs.__imageComfyJobs) {
    globalJobs.__imageComfyJobs = new Map();
  }
  return globalJobs.__imageComfyJobs;
}

export function rememberImageJob(input: {
  jobId: string;
  userId: string;
  prompt: string;
  status?: ComfyJobPhase;
}): void {
  imageJobs().set(input.jobId, {
    userId: input.userId,
    prompt: input.prompt,
    createdAt: Date.now(),
    status: input.status ?? 'queued',
    images: [],
    error: null,
  });
}

export function ownedImageJob(
  jobId: string,
  userId: string,
): OwnedImageJob | null {
  const job = imageJobs().get(jobId);
  if (!job || job.userId !== userId) return null;
  return job;
}

export function patchImageJob(
  jobId: string,
  patch: Partial<Omit<OwnedImageJob, 'userId' | 'prompt' | 'createdAt'>>,
): void {
  const job = imageJobs().get(jobId);
  if (!job) return;
  imageJobs().set(jobId, { ...job, ...patch });
}
