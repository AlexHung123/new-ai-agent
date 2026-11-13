import { NextRequest, NextResponse } from 'next/server';
import { COMFY_UNREACHABLE, comfyViewUrl } from '@/lib/image/comfyClient';
import { getComfyConfig, isComfyConfigured } from '@/lib/image/comfyConfig';
import { ownedImageJob } from '@/lib/image/imageJobStore';
import { requireImageUser } from '@/lib/image/requireImageUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await requireImageUser(req);
  if (userId instanceof NextResponse) return userId;

  const jobId = req.nextUrl.searchParams.get('jobId')?.trim() || '';
  if (!jobId) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  const owned = ownedImageJob(jobId, userId);
  const image = owned?.images[0];
  if (!owned || !image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const config = getComfyConfig();
  if (!isComfyConfigured(config)) {
    return NextResponse.json({ error: COMFY_UNREACHABLE }, { status: 502 });
  }

  let response: Response;
  try {
    response = await fetch(comfyViewUrl(config.baseUrl, image), {
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Failed to fetch ComfyUI image', error);
    return NextResponse.json({ error: COMFY_UNREACHABLE }, { status: 502 });
  }

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: 'ComfyUI image could not be loaded.' },
      { status: response.status >= 400 ? response.status : 502 },
    );
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  return new NextResponse(response.body, {
    status: 200,
    headers: {
      'content-type': contentType,
      'cache-control': 'private, max-age=300',
    },
  });
}
