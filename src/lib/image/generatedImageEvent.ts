export type GeneratedImageStatus =
  | 'queued'
  | 'generating'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type GeneratedImageEvent = {
  status: GeneratedImageStatus;
  prompt?: string;
  jobId?: string;
  imageUrl?: string | null;
  error?: string | null;
  seed?: number;
};

export const GENERATED_IMAGE_EVENT_TYPE = 'generated_image' as const;

export function imageViewUrl(jobId: string): string {
  return `/itms/ai/api/image/view?jobId=${encodeURIComponent(jobId)}`;
}

export function isGeneratedImageEvent(
  value: unknown,
): value is GeneratedImageEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const status = (value as { status?: unknown }).status;
  return (
    status === 'queued' ||
    status === 'generating' ||
    status === 'succeeded' ||
    status === 'failed' ||
    status === 'cancelled'
  );
}
