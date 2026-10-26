export type OwnedTranscribeJob = {
  userId: string;
  filename: string;
  language: string | null;
  historySaved: boolean;
};

const jobs = new Map<string, OwnedTranscribeJob>();

export function rememberTranscribeJob(input: {
  jobId: string;
  userId: string;
  filename: string;
  language: string | null;
}): void {
  jobs.set(input.jobId, {
    userId: input.userId,
    filename: input.filename,
    language: input.language,
    historySaved: false,
  });
}

export function ownedTranscribeJob(
  jobId: string,
  userId: string,
): OwnedTranscribeJob | null {
  const job = jobs.get(jobId);
  if (!job || job.userId !== userId) return null;
  return job;
}

export function markTranscribeHistorySaved(jobId: string): void {
  const job = jobs.get(jobId);
  if (!job) return;
  job.historySaved = true;
}
