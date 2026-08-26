export type AdminChatListItem = {
  id: string;
  title: string;
  userId: string;
  dpId?: string;
  focusMode: string;
  createdAt: string;
};

export function toAdminChatListItem(chat: {
  id: string;
  title: string;
  userId: string;
  focusMode: string;
  createdAt: string;
  documentId?: string | null;
  files?: unknown;
}): AdminChatListItem {
  return {
    id: chat.id,
    title: chat.title,
    userId: chat.userId,
    focusMode: chat.focusMode,
    createdAt: chat.createdAt,
  };
}
