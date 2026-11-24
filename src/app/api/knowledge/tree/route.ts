import { NextResponse } from 'next/server';
import { getDochubConfig } from '@/lib/knowledge/config';
import { getTree } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { isHiddenPublicFolder } from '@/lib/knowledge/library';
import { canWritePublicLibrary } from '@/lib/knowledge/publicAccess';
import { quotaForUser, storageForTree } from '@/lib/knowledge/storage';
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

function emptyTree(library: 'private' | 'public'): KnowledgeTreeNode {
  return stampLibrary({ ...EMPTY_TREE, children: [] }, library);
}

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  const canWritePublic = canWritePublicLibrary(userId);
  try {
    const [privateResult, publicResult] = await Promise.allSettled([
      getTree(userId, { library: 'private' }),
      getTree(userId, { library: 'public' }),
    ]);
    if (privateResult.status === 'rejected' && publicResult.status === 'rejected') {
      return jsonFromUnknownError(privateResult.reason);
    }
    const privateTree =
      privateResult.status === 'fulfilled'
        ? stampLibrary(privateResult.value.tree || emptyTree('private'), 'private')
        : emptyTree('private');
    let publicTree =
      publicResult.status === 'fulfilled'
        ? stampLibrary(publicResult.value.tree || emptyTree('public'), 'public')
        : emptyTree('public');
    publicTree = filterTree(publicTree, (node) => !isHiddenPublicFolder(node.path));
    const config = getDochubConfig();
    const storage = storageForTree(
      privateTree,
      quotaForUser(userId, config.maxUserBytes, config.userQuotaBytes),
    );
    return NextResponse.json({
      user_id: userId,
      tree: privateTree,
      private: { tree: privateTree, storage },
      public: { tree: publicTree },
      canWritePublic,
      storage,
    });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
