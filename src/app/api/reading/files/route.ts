import { NextResponse } from 'next/server';
import {
  addReadingAttachment,
  listReadingAttachments,
  ReadingAttachmentError,
} from '@/lib/reading/store';
import { toPublicReadingAttachment } from '@/lib/reading/types';

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
  const items = listReadingAttachments(userId).map(toPublicReadingAttachment);
  return NextResponse.json({ items });
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
    const item = await addReadingAttachment({
      userId,
      filename: uploaded.name,
      bytes,
      mimeType: uploaded.type || undefined,
    });
    return NextResponse.json({ item: toPublicReadingAttachment(item) });
  } catch (error) {
    if (error instanceof ReadingAttachmentError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error('reading file upload failed', error);
    return NextResponse.json(
      { message: 'Could not save this PDF' },
      { status: 500 },
    );
  }
}
