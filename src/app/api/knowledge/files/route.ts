import { NextResponse } from 'next/server';
import { convertKnowledgeAttachment } from '@/lib/knowledge/convert';
import { getDochubConfig } from '@/lib/knowledge/config';
import { uploadFile } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { isSafeRelativePath } from '@/lib/knowledge/paths';
import { displayFilename } from '@/lib/writing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { message: 'Expected multipart form data' },
      { status: 400 },
    );
  }
  const uploaded = form.get('file');
  if (!(uploaded instanceof File)) {
    return NextResponse.json({ message: 'file is required' }, { status: 400 });
  }
  const relativePath = String(form.get('relative_path') || '').trim();
  if (!isSafeRelativePath(relativePath)) {
    return NextResponse.json({ message: 'Invalid relative_path' }, { status: 400 });
  }
  const config = getDochubConfig();
  const bytes = new Uint8Array(await uploaded.arrayBuffer());
  if (bytes.byteLength > config.maxUploadBytes) {
    return NextResponse.json({ message: 'This file is too large.' }, { status: 413 });
  }
  const filename = displayFilename(relativePath);
  const converted = await convertKnowledgeAttachment(bytes, filename, {
    maxBytes: config.maxUploadBytes,
  });
  if (!converted.ok) {
    return NextResponse.json({ message: converted.error }, { status: 400 });
  }
  try {
    const result = await uploadFile(userId, {
      original: bytes,
      originalName: filename,
      originalType: uploaded.type || undefined,
      markdown: converted.markdown,
      relativePath,
    });
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
