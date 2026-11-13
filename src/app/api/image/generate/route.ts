import { NextRequest, NextResponse } from 'next/server';
import { COMFY_UNREACHABLE, submitComfyPrompt } from '@/lib/image/comfyClient';
import {
  getComfyConfig,
  isComfyConfigured,
  resolveWorkflowFilePath,
} from '@/lib/image/comfyConfig';
import {
  buildPromptWorkflow,
  loadComfyWorkflow,
} from '@/lib/image/comfyWorkflow';
import { rememberImageJob } from '@/lib/image/imageJobStore';
import { requireImageUser } from '@/lib/image/requireImageUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await requireImageUser(req);
  if (userId instanceof NextResponse) return userId;

  const config = getComfyConfig();
  if (!isComfyConfigured(config)) {
    return NextResponse.json(
      {
        error:
          'ComfyUI is not configured. Set comfy.baseUrl in data/config.json.',
      },
      { status: 400 },
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const prompt =
    body &&
    typeof body === 'object' &&
    typeof (body as { prompt?: unknown }).prompt === 'string'
      ? (body as { prompt: string }).prompt
      : '';

  let template;
  try {
    template = loadComfyWorkflow(resolveWorkflowFilePath(config.workflowPath));
  } catch (error) {
    console.error('Failed to load ComfyUI workflow', error);
    return NextResponse.json(
      { error: 'ComfyUI workflow template could not be loaded.' },
      { status: 500 },
    );
  }

  const built = buildPromptWorkflow(template, prompt);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const submitted = await submitComfyPrompt({
    baseUrl: config.baseUrl,
    workflow: built.workflow,
  });
  if (!submitted.ok) {
    return NextResponse.json(
      { error: submitted.error || COMFY_UNREACHABLE },
      { status: submitted.status },
    );
  }

  rememberImageJob({
    jobId: submitted.promptId,
    userId,
    prompt: built.prompt,
    status: 'queued',
  });

  return NextResponse.json({
    jobId: submitted.promptId,
    status: 'queued',
  });
}
