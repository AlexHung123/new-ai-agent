import { NextResponse } from 'next/server';
import { getDochubConfig } from '@/lib/knowledge/config';
import { getTree } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { quotaForUser, storageForTree } from '@/lib/knowledge/storage';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMPTY_TREE: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [],
};

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  try {
    const body = await getTree(userId);
    const tree = body.tree || EMPTY_TREE;
    const config = getDochubConfig();
    const storage = storageForTree(
      tree,
      quotaForUser(userId, config.maxUserBytes, config.userQuotaBytes),
    );
    return NextResponse.json({ ...body, tree, storage });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
