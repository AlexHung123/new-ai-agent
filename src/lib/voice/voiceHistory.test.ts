import { describe, expect, it } from 'vitest';
import { DEFAULT_TTS_MODEL } from './ttsModels';
import { buildVoiceHistoryRows, saveVoiceHistory } from './voiceHistory';

describe('buildVoiceHistoryRows', () => {
  it('builds an Agent Voice chat titled with the spoken text', () => {
    const rows = buildVoiceHistoryRows({
      userId: 'user-1',
      spokenText: '你好，歡迎使用粵語語音合成。',
      model: DEFAULT_TTS_MODEL,
      chatId: 'chat-voice-1',
      userMessageId: 'user-msg-1',
      assistantMessageId: 'asst-msg-1',
      createdAt: 'Mon Aug 25 2026',
    });

    expect(rows.chat).toEqual({
      id: 'chat-voice-1',
      title: '你好，歡迎使用粵語語音合成。',
      userId: 'user-1',
      createdAt: 'Mon Aug 25 2026',
      focusMode: 'agentVoice',
      documentId: null,
      files: [],
    });
    expect(rows.messages).toEqual([
      {
        content: '你好，歡迎使用粵語語音合成。',
        chatId: 'chat-voice-1',
        userId: 'user-1',
        messageId: 'user-msg-1',
        role: 'user',
        createdAt: 'Mon Aug 25 2026',
      },
      {
        content: `Speech generated (${DEFAULT_TTS_MODEL}).`,
        chatId: 'chat-voice-1',
        userId: 'user-1',
        messageId: 'asst-msg-1',
        role: 'assistant',
        createdAt: 'Mon Aug 25 2026',
      },
    ]);
  });

  it('includes the reference transcript in the assistant message when provided', () => {
    const rows = buildVoiceHistoryRows({
      userId: 'user-1',
      spokenText: 'Hello.',
      model: DEFAULT_TTS_MODEL,
      refText: 'reference wording',
      chatId: 'chat-2',
      userMessageId: 'u2',
      assistantMessageId: 'a2',
      createdAt: 'now',
    });

    expect(rows.messages[1]?.content).toBe(
      `Speech generated (${DEFAULT_TTS_MODEL}).\n\nReference transcript:\nreference wording`,
    );
  });

  it('omits the reference transcript when it is blank', () => {
    const rows = buildVoiceHistoryRows({
      userId: 'user-1',
      spokenText: 'Hello.',
      model: DEFAULT_TTS_MODEL,
      refText: '   ',
      chatId: 'chat-3',
      userMessageId: 'u3',
      assistantMessageId: 'a3',
      createdAt: 'now',
    });

    expect(rows.messages[1]?.content).toBe(
      `Speech generated (${DEFAULT_TTS_MODEL}).`,
    );
  });
});

describe('saveVoiceHistory', () => {
  it('inserts the chat and both messages', async () => {
    const inserted: { chats: unknown[]; messages: unknown[] } = {
      chats: [],
      messages: [],
    };

    const result = await saveVoiceHistory(
      {
        userId: 'user-9',
        spokenText: 'Generated line',
        model: DEFAULT_TTS_MODEL,
      },
      {
        store: {
          insertChat: async (chat) => {
            inserted.chats.push(chat);
          },
          insertMessages: async (messages) => {
            inserted.messages.push(...messages);
          },
        },
        createIds: () => ({
          chatId: 'fixed-chat',
          userMessageId: 'fixed-user',
          assistantMessageId: 'fixed-asst',
        }),
        now: () => new Date('2026-08-25T00:00:00.000Z'),
      },
    );

    expect(result).toEqual({ chatId: 'fixed-chat' });
    expect(inserted.chats).toHaveLength(1);
    expect(inserted.chats[0]).toMatchObject({
      id: 'fixed-chat',
      title: 'Generated line',
      focusMode: 'agentVoice',
      userId: 'user-9',
    });
    expect(inserted.messages).toHaveLength(2);
    expect(inserted.messages.map((row) => (row as { role: string }).role)).toEqual([
      'user',
      'assistant',
    ]);
  });
});
