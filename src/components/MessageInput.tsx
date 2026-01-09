import { cn } from '@/lib/utils';
import { ArrowUp, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import { focusModes } from '@/lib/agents';
import SfcExactMatchToggle from './SfcExactMatchToggle';

const MessageInput = () => {
  const { loading, sendMessage, stop, focusMode, sfcExactMatch } = useChat();

  const [message, setMessage] = useState('');
  const [textareaRows, setTextareaRows] = useState(1);
  const [mode, setMode] = useState<'multi' | 'single'>('single');

  const currentAgent = focusModes.find((mode) => mode.key === focusMode);
  let placeholder = currentAgent?.followUpPlaceholder || 'Ask a follow-up';

  if (focusMode === 'agentSFC' && sfcExactMatch) {
    placeholder = 'Search exact wording ...';
  }

  useEffect(() => {
    if (textareaRows >= 2 && message && mode === 'single') {
      setMode('multi');
    } else if (!message && mode === 'multi') {
      setMode('single');
    }
  }, [textareaRows, mode, message]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <form
      onSubmit={(e) => {
        if (loading) return;
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !loading) {
          e.preventDefault();
          sendMessage(message);
          setMessage('');
        }
      }}
      className={cn(
        'bg-light-secondary dark:bg-dark-secondary px-3 pt-5 pb-3 flex flex-col rounded-2xl w-full border border-light-200 dark:border-dark-200 shadow-sm shadow-light-200/10 dark:shadow-black/20 transition-all duration-200 focus-within:border-light-300 dark:focus-within:border-dark-300',
      )}
    >
      <TextareaAutosize
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onHeightChange={(height, props) => {
          setTextareaRows(Math.ceil(height / props.rowHeight));
        }}
        className="px-2 bg-transparent dark:placeholder:text-white/50 placeholder:text-sm text-sm dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48"
        placeholder={placeholder}
      />
      <div className="flex flex-row items-center justify-end mt-4">
        <SfcExactMatchToggle />
        <button
          disabled={message.trim().length === 0 && !loading}
          onClick={(e) => {
            e.preventDefault();
            if (loading) {
              stop();
            } else {
              sendMessage(message);
              setMessage('');
            }
          }}
          className="bg-[#24A0ED] text-white disabled:text-black/50 dark:disabled:text-white/50 hover:bg-opacity-85 transition duration-100 disabled:bg-[#e0e0dc79] dark:disabled:bg-[#ececec21] rounded-full p-2"
        >
          {loading ? (
            <Square className="bg-background" fill="white" size={17} />
          ) : (
            <ArrowUp className="bg-background" size={17} />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
