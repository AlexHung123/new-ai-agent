import db from '@/lib/db';
import { chats, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    // Get userId from middleware (verified from token)
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return Response.json(
        { message: 'Unauthorized - Authentication required' },
        { status: 401 },
      );
    }

    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, id),
    });

    if (!chatExists) {
      return Response.json({ message: 'Chat not found' }, { status: 404 });
    }

    // Validate that the chat belongs to the requesting user
    if (chatExists.userId !== userId) {
      return Response.json(
        { message: 'Unauthorized access to chat' },
        { status: 403 },
      );
    }

    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, id),
    });

    return Response.json(
      {
        chat: chatExists,
        messages: chatMessages,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in getting chat by id: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    // Get userId from middleware (verified from token)
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return Response.json(
        { message: 'Unauthorized - Authentication required' },
        { status: 401 },
      );
    }

    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, id),
    });

    if (!chatExists) {
      return Response.json({ message: 'Chat not found' }, { status: 404 });
    }

    // Validate that the chat belongs to the requesting user
    if (chatExists.userId !== userId) {
      return Response.json(
        { message: 'Unauthorized to delete this chat' },
        { status: 403 },
      );
    }

    await db.delete(chats).where(eq(chats.id, id)).execute();
    await db.delete(messages).where(eq(messages.chatId, id)).execute();

    return Response.json(
      { message: 'Chat deleted successfully' },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in deleting chat by id: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
