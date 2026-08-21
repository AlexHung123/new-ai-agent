import { NextResponse } from 'next/server';
import {
  addUserWritingFile,
  listUserWritingFiles,
  publicUserWritingFiles,
  removeUserWritingFile,
} from '@/lib/writing/userFiles';
import { WritingAttachmentError } from '@/lib/writing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function userIdFrom(req: Request): string | null {
  return req.headers.get('x-user-id');
}

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const files = await listUserWritingFiles(userId);
  const filtered = q
    ? files.filter((file) => file.name.toLowerCase().includes(q))
    : files;
  return NextResponse.json({ items: publicUserWritingFiles(filtered) });
}

export async function POST(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }

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

  const bytes = new Uint8Array(await uploaded.arrayBuffer());
  try {
    const item = await addUserWritingFile({
      userId,
      filename: uploaded.name,
      bytes,
      mimeType: uploaded.type || undefined,
    });
    return NextResponse.json({ item: publicUserWritingFiles([item])[0] });
  } catch (error) {
    if (error instanceof WritingAttachmentError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error('writing file upload failed', error);
    return NextResponse.json(
      { message: 'Could not save this file' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const fileId = (url.searchParams.get('fileId') || '').trim();
  if (!fileId) {
    return NextResponse.json({ message: 'fileId is required' }, { status: 400 });
  }
  const ok = await removeUserWritingFile(userId, fileId);
  if (!ok) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
