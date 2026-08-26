import crypto from 'crypto';
import db from '@/lib/db';
import { chats, messages as messagesSchema } from '@/lib/db/schema';

export const VOICE_FOCUS_MODE = 'agentVoice';

export type VoiceHistoryChatRow = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  focusMode: string;
  documentId: null;
  files: [];
};

export type VoiceHistoryMessageRow = {
  content: string;
  chatId: string;
  userId: string;
  messageId: string;
  role: 'user' | 'assistant';
  createdAt: string;
};

export type VoiceHistoryStore = {
  insertChat: (chat: VoiceHistoryChatRow) => Promise<unknown>;
  insertMessages: (rows: VoiceHistoryMessageRow[]) => Promise<unknown>;
};

export type VoiceHistoryInput = {
  userId: string;
  spokenText: string;
  model: string;
  refText?: string;
};

export function buildVoiceHistoryRows(input: {
  userId: string;
  spokenText: string;
  model: string;
  refText?: string;
  chatId: string;
  userMessageId: string;
  assistantMessageId: string;
  createdAt: string;
}): { chat: VoiceHistoryChatRow; messages: VoiceHistoryMessageRow[] } {
  const spokenText = input.spokenText.trim();
  const assistantLines = [`Speech generated (${input.model}).`];
  const refText = input.refText?.trim() ?? '';
  if (refText) {
    assistantLines.push('', 'Reference transcript:', refText);
  }

  return {
    chat: {
      id: input.chatId,
      title: spokenText,
      userId: input.userId,
      createdAt: input.createdAt,
      focusMode: VOICE_FOCUS_MODE,
      documentId: null,
      files: [],
    },
    messages: [
      {
        content: spokenText,
        chatId: input.chatId,
        userId: input.userId,
        messageId: input.userMessageId,
        role: 'user',
        createdAt: input.createdAt,
      },
      {
        content: assistantLines.join('\n'),
        chatId: input.chatId,
        userId: input.userId,
        messageId: input.assistantMessageId,
        role: 'assistant',
        createdAt: input.createdAt,
      },
    ],
  };
}

export function createVoiceHistoryIds() {
  return {
    chatId: crypto.randomBytes(20).toString('hex'),
    userMessageId: crypto.randomBytes(7).toString('hex'),
    assistantMessageId: crypto.randomBytes(7).toString('hex'),
  };
}

export const drizzleVoiceHistoryStore: VoiceHistoryStore = {
  insertChat: async (chat) => {
    await db.insert(chats).values(chat).execute();
  },
  insertMessages: async (rows) => {
    if (rows.length === 0) return;
    await db.insert(messagesSchema).values(rows).execute();
  },
};

export async function saveVoiceHistory(
  input: VoiceHistoryInput,
  deps: {
    store?: VoiceHistoryStore;
    createIds?: () => {
      chatId: string;
      userMessageId: string;
      assistantMessageId: string;
    };
    now?: () => Date;
  } = {},
): Promise<{ chatId: string }> {
  const ids = (deps.createIds ?? createVoiceHistoryIds)();
  const createdAt = (deps.now ?? (() => new Date()))().toString();
  const rows = buildVoiceHistoryRows({
    userId: input.userId,
    spokenText: input.spokenText,
    model: input.model,
    refText: input.refText,
    chatId: ids.chatId,
    userMessageId: ids.userMessageId,
    assistantMessageId: ids.assistantMessageId,
    createdAt,
  });

  const store = deps.store ?? drizzleVoiceHistoryStore;
  await store.insertChat(rows.chat);
  await store.insertMessages(rows.messages);
  return { chatId: ids.chatId };
}
