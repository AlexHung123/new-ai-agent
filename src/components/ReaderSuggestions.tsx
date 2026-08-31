'use client';

import { useChat } from '@/lib/hooks/useChat';

const CHIPS = [
  { label: 'Summarize', prompt: 'Summarize this document.' },
  { label: 'Key points', prompt: 'List the key points.' },
  { label: 'Terms', prompt: 'Extract important terms and short definitions.' },
];

const ReaderSuggestions = () => {
  const { sendMessage, loading, readerSelection } = useChat();

  const run = (prompt: string) => {
    if (loading) return;
    void sendMessage(prompt);
  };

  return (
    <div className="reader-suggestions" aria-label="Suggested prompts">
      {CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          className="reader-chip"
          disabled={loading}
          onClick={() => run(chip.prompt)}
        >
          {chip.label}
        </button>
      ))}
      {readerSelection ? (
        <button
          type="button"
          className="reader-chip"
          disabled={loading}
          onClick={() => run('Explain this passage.')}
        >
          Explain selection
        </button>
      ) : null}
    </div>
  );
};

export default ReaderSuggestions;
