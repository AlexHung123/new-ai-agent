import db from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { message: 'userId is required' },
        { status: 400 },
      );
    }

    let chatList = await db.query.chats.findMany({
      where: eq(chats.userId, userId),
    });
    chatList = chatList.reverse();
    return Response.json({ chats: chatList }, { status: 200 });
  } catch (err) {
    console.error('Error in getting chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
