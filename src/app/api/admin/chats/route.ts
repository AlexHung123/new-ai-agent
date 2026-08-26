import db from '@/lib/db';
import { toAdminChatListItem } from '@/lib/auth/adminChatList';
import { paginateAdminChats, parseAdminChatQuery } from '@/lib/auth/adminChatQuery';
import { attachDpIds, fetchDpIdByUserId } from '@/lib/auth/capUserDpIds';
import { requireAdmin } from '@/lib/auth/isAdminUser';
import {
  SFC_DOCUMENT_FOCUS_MODE,
  SFC_REPLY_FOCUS_MODE,
  findDisplayFocusMode,
  focusModes,
} from '@/lib/agents';

const agentTitleByFocusMode = {
  ...Object.fromEntries(focusModes.map((mode) => [mode.key, mode.title])),
  [SFC_REPLY_FOCUS_MODE]: findDisplayFocusMode(SFC_REPLY_FOCUS_MODE)?.title ?? 'Agent SFC',
  [SFC_DOCUMENT_FOCUS_MODE]:
    findDisplayFocusMode(SFC_DOCUMENT_FOCUS_MODE)?.title ?? 'Agent SFC',
};

export const GET = async (req: Request) => {
  try {
    const userId = req.headers.get('x-user-id');
    const denied = requireAdmin(userId);
    if (denied) {
      return denied;
    }

    const url = new URL(req.url);
    const query = parseAdminChatQuery({
      q: url.searchParams.get('q'),
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize'),
    });

    const rows = await db.query.chats.findMany();
    const items = rows.map(toAdminChatListItem).reverse();

    let dpIdByUserId: Record<string, string> = {};
    try {
      dpIdByUserId = await fetchDpIdByUserId(items.map((item) => item.userId));
    } catch (err) {
      console.error('Error looking up cap_user dp_id: ', err);
    }

    const result = paginateAdminChats(
      attachDpIds(items, dpIdByUserId),
      query,
      agentTitleByFocusMode,
    );

    return Response.json(result, { status: 200 });
  } catch (err) {
    console.error('Error in getting admin chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
