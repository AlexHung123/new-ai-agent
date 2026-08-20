import { NextResponse } from 'next/server';
import {
  listAvailableDocuments,
  toPublicDocumentItem,
} from '@/lib/documents/catalog';

export async function GET() {
  return NextResponse.json({
    items: listAvailableDocuments().map(toPublicDocumentItem),
  });
}
