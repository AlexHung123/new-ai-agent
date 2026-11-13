import { NextRequest, NextResponse } from 'next/server';
import {
  COMFY_UNREACHABLE,
  cancelComfyJob,
  readComfyHistory,
  readComfyQueuePhase,
} from '@/lib/image/comfyClient';
import { getComfyConfig, isComfyConfigured } from '@/lib/image/comfyConfig';
import { isTerminalImageStatus } from '@/lib/image/imageJobProtocol';
import { ownedImageJob, patchImageJob } from '@/lib/image/imageJobStore';
import { requireImageUser } from '@/lib/image/requireImageUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function imageUrlFor(jobId: string): string {
  return `/itms/ai/api/image/view?jobId=${encodeURIComponent(jobId)}`;
}

async function loadOwnedJob(req: NextRequest, jobId: string) {
  const userId = await requireImageUser(req);
  if (userId instanceof NextResponse) return userId;
  if (!jobId.trim()) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  const owned = ownedImageJob(jobId, userId);
  if (!owned) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  const config = getComfyConfig();
  if (!isComfyConfigured(config)) {
    return NextResponse.json({ error: COMFY_UNREACHABLE }, { status: 502 });
  }
  return { userId, owned, config, jobId };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const loaded = await loadOwnedJob(req, jobId);
  if (loaded instanceof NextResponse) return loaded;

  if (isTerminalImageStatus(loaded.owned.status)) {
    return NextResponse.json({
      jobId,
      status: loaded.owned.status,
      prompt: loaded.owned.prompt,
      error: loaded.owned.error ?? null,
      imageUrl: loaded.owned.images.length > 0 ? imageUrlFor(jobId) : null,
    });
  }

  if (Date.now() - loaded.owned.createdAt > loaded.config.timeoutMs) {
    patchImageJob(jobId, {
      status: 'failed',
      error: 'Image generation timed out.',
    });
    return NextResponse.json({
      jobId,
      status: 'failed',
      prompt: loaded.owned.prompt,
      error: 'Image generation timed out.',
      imageUrl: null,
    });
  }

  const history = await readComfyHistory({
    baseUrl: loaded.config.baseUrl,
    promptId: jobId,
  });
  if (!history.ok) {
    return NextResponse.json(
      { error: history.error || COMFY_UNREACHABLE },
      { status: history.status },
    );
  }

  if (history.result.state === 'succeeded') {
    patchImageJob(jobId, {
      status: 'succeeded',
      images: history.result.images,
      error: null,
    });
    return NextResponse.json({
      jobId,
      status: 'succeeded',
      prompt: loaded.owned.prompt,
      imageUrl: imageUrlFor(jobId),
    });
  }

  if (history.result.state === 'failed') {
    patchImageJob(jobId, {
      status: 'failed',
      error: history.result.error,
    });
    return NextResponse.json({
      jobId,
      status: 'failed',
      prompt: loaded.owned.prompt,
      error: history.result.error,
      imageUrl: null,
    });
  }

  const status = await readComfyQueuePhase({
    baseUrl: loaded.config.baseUrl,
    promptId: jobId,
  });
  patchImageJob(jobId, { status });
  return NextResponse.json({
    jobId,
    status,
    prompt: loaded.owned.prompt,
  });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const loaded = await loadOwnedJob(req, jobId);
  if (loaded instanceof NextResponse) return loaded;

  if (isTerminalImageStatus(loaded.owned.status)) {
    return NextResponse.json({
      jobId,
      status: loaded.owned.status,
    });
  }

  const cancelled = await cancelComfyJob({
    baseUrl: loaded.config.baseUrl,
    promptId: jobId,
  });
  if (!cancelled.ok) {
    return NextResponse.json(
      { error: cancelled.error || COMFY_UNREACHABLE },
      { status: cancelled.status },
    );
  }
  patchImageJob(jobId, { status: 'cancelled', error: 'Cancelled' });
  return NextResponse.json({ jobId, status: 'cancelled' });
}
