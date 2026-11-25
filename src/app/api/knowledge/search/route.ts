import { NextResponse } from 'next/server';
import { search } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import {
  filterHiddenPublicHits,
  isHiddenPublicFolder,
  parseKnowledgeLibrary,
  parseKnowledgeLibraryStrict,
} from '@/lib/knowledge/library';
import { isSafeRelativePath } from '@/lib/knowledge/paths';
import { normalizeSearchRequest } from '@/lib/knowledge/search';
import type { KnowledgeLibraryName } from '@/lib/knowledge/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function tagResults(result: Record<string, unknown>, library: KnowledgeLibraryName) {
  const raw = Array.isArray(result.results) ? result.results : [];
  const visible = library === 'public' ? filterHiddenPublicHits(raw) : raw;
  const results = visible.map((item) =>
    item && typeof item === 'object'
      ? { ...(item as Record<string, unknown>), library }
      : item,
  );
  return { ...result, library, results };
}

export async function POST(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = normalizeSearchRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }
  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const rawLibrary = rec.library ?? rec.visibility;
  const searchBoth =
    typeof rawLibrary === 'string' && rawLibrary.trim().toLowerCase() === 'all';
  if (rawLibrary != null && !searchBoth && parseKnowledgeLibraryStrict(rawLibrary) == null) {
    return NextResponse.json(
      { message: 'library must be private, public, or all' },
      { status: 400 },
    );
  }
  const library = searchBoth ? 'private' : parseKnowledgeLibrary(rawLibrary, 'private');
  const path =
    typeof rec.path === 'string' && rec.path.trim() && isSafeRelativePath(rec.path.trim())
      ? rec.path.trim()
      : undefined;
  if (!searchBoth && library === 'public' && path && isHiddenPublicFolder(path)) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }
  const input = {
    query: parsed.query,
    mode: parsed.mode,
    limit: parsed.limit,
    path,
  };
  try {
    if (!searchBoth) {
      const result = await search(userId, input, { library });
      return NextResponse.json(tagResults(result as Record<string, unknown>, library));
    }
    const [privateResult, publicResult] = await Promise.allSettled([
      search(userId, input, { library: 'private' }),
      path && isHiddenPublicFolder(path)
        ? Promise.resolve({ results: [] })
        : search(userId, input, { library: 'public' }),
    ]);
    const privateBody =
      privateResult.status === 'fulfilled'
        ? tagResults(privateResult.value as Record<string, unknown>, 'private')
        : { results: [], library: 'private' };
    const publicBody =
      publicResult.status === 'fulfilled'
        ? tagResults(publicResult.value as Record<string, unknown>, 'public')
        : { results: [], library: 'public' };
    if (privateResult.status === 'rejected' && publicResult.status === 'rejected') {
      return jsonFromUnknownError(privateResult.reason);
    }
    return NextResponse.json({
      library: 'all',
      results: [...(privateBody.results as unknown[]), ...(publicBody.results as unknown[])],
      private: privateBody,
      public: publicBody,
    });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
