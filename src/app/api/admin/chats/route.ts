import db from '@/lib/db';
import { toAdminChatListItem } from '@/lib/auth/adminChatList';
import { paginateAdminChats, parseAdminChatQuery } from '@/lib/auth/adminChatQuery';
import { requireAdmin } from '@/lib/auth/isAdminUser';
import { focusModes } from '@/lib/agents';

const agentTitleByFocusMode = Object.fromEntries(
  focusModes.map((mode) => [mode.key, mode.title]),
);

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
    const result = paginateAdminChats(items, query, agentTitleByFocusMode);

    return Response.json(result, { status: 200 });
  } catch (err) {
    console.error('Error in getting admin chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
