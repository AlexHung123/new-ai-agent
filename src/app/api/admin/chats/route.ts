import db from '@/lib/db';
import { toAdminChatListItem } from '@/lib/auth/adminChatList';
import { requireAdmin } from '@/lib/auth/isAdminUser';

export const GET = async (req: Request) => {
  try {
    const userId = req.headers.get('x-user-id');
    const denied = requireAdmin(userId);
    if (denied) {
      return denied;
    }

    const rows = await db.query.chats.findMany();
    const chats = rows.map(toAdminChatListItem).reverse();

    return Response.json({ chats }, { status: 200 });
  } catch (err) {
    console.error('Error in getting admin chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
