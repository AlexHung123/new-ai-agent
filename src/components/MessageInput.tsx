import { cn } from '@/lib/utils';
import { ArrowUp, Square } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import { focusModes } from '@/lib/agents';
import SfcExactMatchToggle from './SfcExactMatchToggle';

const MessageInput = memo(function MessageInput() {
  const {
    loading,
    sendMessage,
    stop,
    focusMode,
    sfcExactMatch,
    documentId,
  } = useChat();

  const [message, setMessage] = useState('');

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const placeholder = useMemo(() => {
    const currentAgent = focusModes.find((m) => m.key === focusMode);
    const base = currentAgent?.followUpPlaceholder || 'Ask a follow-up';
    if (focusMode === 'agentSFC' && sfcExactMatch)
      return 'Search exact wording ...';
    return base;
  }, [focusMode, sfcExactMatch]);

  const submit = useCallback(() => {
    if (loading) return;
    if (focusMode === 'agentDocument' && !documentId) return;

    const content = message.trim();
    if (!content) return;

    sendMessage(content);
    setMessage('');
    inputRef.current?.focus();
  }, [loading, message, sendMessage, focusMode, documentId]);

  // Global shortcut: press "/" to focus textarea when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;

      const el = document.activeElement as HTMLElement | null;
      const isTypingTarget =
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.getAttribute('contenteditable') === 'true';

      if (isTypingTarget) return;

      e.preventDefault();
      inputRef.current?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submit();
    },
    [submit],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter = send, Shift+Enter = newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const onActionClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (loading) stop();
      else submit();
    },
    [loading, stop, submit],
  );

  const documentBlocked = focusMode === 'agentDocument' && !documentId;
  const disabled =
    (!loading && message.trim().length === 0) ||
    (!loading && documentBlocked);

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      className={cn(
        'bg-light-secondary dark:bg-dark-secondary px-3 pt-5 pb-3 flex flex-col rounded-2xl w-full border border-light-200 dark:border-dark-200 shadow-sm shadow-light-200/10 dark:shadow-black/20 transition-all duration-200 focus-within:border-light-300 dark:focus-within:border-dark-300',
      )}
    >
      <TextareaAutosize
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="px-2 bg-transparent dark:placeholder:text-white/50 placeholder:text-sm text-sm dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48"
        placeholder={placeholder}
      />

      <div className="flex flex-row items-center justify-end mt-4 gap-3">
        <SfcExactMatchToggle />

        <button
          disabled={disabled}
          onClick={onActionClick}
          className="bg-[#24A0ED] text-white disabled:text-black/50 dark:disabled:text-white/50 hover:bg-opacity-85 transition duration-100 disabled:bg-[#e0e0dc79] dark:disabled:bg-[#ececec21] rounded-full p-2"
          aria-label={loading ? 'Stop generating' : 'Send message'}
          type="button"
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
});

export default MessageInput;
