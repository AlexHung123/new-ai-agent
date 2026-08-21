import { Message } from '@/components/ChatWindow';

export const getSuggestions = async (chatHistory: Message[]) => {
  const res = await fetch(`/itms/ai/api/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatHistory: chatHistory,
    }),
  });

  const data = (await res.json()) as { suggestions: string[] };

  return data.suggestions;
};
