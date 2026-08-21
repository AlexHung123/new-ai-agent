import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import { focusModes } from '@/lib/agents';
import SfcExactMatchToggle from './SfcExactMatchToggle';

const SendArrow = () => (
  <span className="send-btn-icon" aria-hidden>
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const EmptyChatMessageInput = () => {
  const { sendMessage, focusMode, sfcExactMatch, documentId } = useChat();
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const currentAgent = focusModes.find((mode) => mode.key === focusMode);
  let placeholder = currentAgent?.placeholder || 'Ask about this domain wiki…';
  const documentBlocked = focusMode === 'agentDocument' && !documentId;

  if (focusMode === 'agentSFC' && sfcExactMatch) {
    placeholder = 'Search exact wording ...';
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;

      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const canSend = message.trim().length > 0 && !documentBlocked;

  const submit = () => {
    if (!canSend) return;
    sendMessage(message);
    setMessage('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      }}
      className="composer"
    >
      <TextareaAutosize
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        minRows={1}
        maxRows={8}
        className="composer-input"
        placeholder={placeholder}
      />
      <div className="composer-toolbar">
        <div className="composer-toolbar-left">
          <SfcExactMatchToggle />
        </div>
        <div className="composer-toolbar-right">
          <button
            type="submit"
            disabled={!canSend}
            className={`send-btn${canSend ? ' send-btn-active' : ''}`}
            aria-label="Send message"
          >
            <SendArrow />
            Send
          </button>
        </div>
      </div>
    </form>
  );
};

export default EmptyChatMessageInput;
