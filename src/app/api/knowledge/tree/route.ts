import { NextResponse } from 'next/server';
import { getDochubConfig } from '@/lib/knowledge/config';
import { getTree } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import {
  isHiddenPublicFolder,
  parseKnowledgeLibraryStrict,
  type KnowledgeLibrary,
} from '@/lib/knowledge/library';
import { canWritePublicLibrary } from '@/lib/knowledge/publicAccess';
import {
  quotaForLibrary,
  quotaForUser,
  storageForTree,
  type KnowledgeStorageUsage,
} from '@/lib/knowledge/storage';
import { filterTree, stampLibrary } from '@/lib/knowledge/tree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMPTY_TREE: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [],
};

function emptyTree(library: KnowledgeLibrary): KnowledgeTreeNode {
  return stampLibrary({ ...EMPTY_TREE, children: [] }, library);
}

function visibleTree(
  raw: KnowledgeTreeNode | undefined,
  library: KnowledgeLibrary,
): KnowledgeTreeNode {
  let tree = stampLibrary(raw || emptyTree(library), library);
  if (library === 'public') {
    tree = filterTree(tree, (node) => !isHiddenPublicFolder(node.path));
  }
  return tree;
}

function packLibrary(
  raw: KnowledgeTreeNode | undefined,
  library: KnowledgeLibrary,
  userId: string,
): { tree: KnowledgeTreeNode; storage: KnowledgeStorageUsage } {
  const tree = visibleTree(raw, library);
  const config = getDochubConfig();
  const quota =
    library === 'public'
      ? quotaForLibrary(
          'public',
          userId,
          config.maxUserBytes,
          config.userQuotaBytes,
        )
      : quotaForUser(userId, config.maxUserBytes, config.userQuotaBytes);
  return { tree, storage: storageForTree(tree, quota) };
}

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  const canWritePublic = canWritePublicLibrary(userId);
  const rawLibrary = new URL(req.url).searchParams.get('library');
  if (rawLibrary != null && rawLibrary !== '') {
    const scoped = parseKnowledgeLibraryStrict(rawLibrary);
    if (!scoped) {
      return NextResponse.json(
        { message: 'library must be private or public' },
        { status: 400 },
      );
    }
    try {
      const result = await getTree(userId, { library: scoped });
      const packed = packLibrary(result.tree, scoped, userId);
      return NextResponse.json({
        user_id: userId,
        tree: packed.tree,
        [scoped]: packed,
        canWritePublic,
        storage: packed.storage,
      });
    } catch (error) {
      return jsonFromUnknownError(error);
    }
  }

  try {
    const [privateResult, publicResult] = await Promise.allSettled([
      getTree(userId, { library: 'private' }),
      getTree(userId, { library: 'public' }),
    ]);
    if (privateResult.status === 'rejected' && publicResult.status === 'rejected') {
      return jsonFromUnknownError(privateResult.reason);
    }
    const privatePacked = packLibrary(
      privateResult.status === 'fulfilled' ? privateResult.value.tree : undefined,
      'private',
      userId,
    );
    const publicPacked = packLibrary(
      publicResult.status === 'fulfilled' ? publicResult.value.tree : undefined,
      'public',
      userId,
    );
    return NextResponse.json({
      user_id: userId,
      tree: privatePacked.tree,
      private: privatePacked,
      public: publicPacked,
      canWritePublic,
      storage: privatePacked.storage,
    });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
