export type OwnedTranscribeJob = {
  userId: string;
  filename: string;
  language: string | null;
  historySaved: boolean;
};

const globalJobs = globalThis as typeof globalThis & {
  __voiceTranscribeJobs?: Map<string, OwnedTranscribeJob>;
};

function transcribeJobs(): Map<string, OwnedTranscribeJob> {
  if (!globalJobs.__voiceTranscribeJobs) {
    globalJobs.__voiceTranscribeJobs = new Map();
  }
  return globalJobs.__voiceTranscribeJobs;
}

export function rememberTranscribeJob(input: {
  jobId: string;
  userId: string;
  filename: string;
  language: string | null;
}): void {
  transcribeJobs().set(input.jobId, {
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
  const job = transcribeJobs().get(jobId);
  if (!job || job.userId !== userId) return null;
  return job;
}

export function markTranscribeHistorySaved(jobId: string): void {
  const job = transcribeJobs().get(jobId);
  if (!job) return;
  job.historySaved = true;
}
