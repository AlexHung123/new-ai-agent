import { cn } from '@/lib/utils';
import { ArrowUp, Square } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import { focusModes } from '@/lib/agents';
import SfcExactMatchToggle from './SfcExactMatchToggle';
import SfcTrainingRelatedToggle from './SfcTrainingRelatedToggle';

const ASPECT_KEY = 'agentImageAspect';
const DEFAULT_ASPECT = '1:1';

const MessageInput = memo(function MessageInput() {
  const { loading, sendMessage, stop, focusMode, sfcExactMatch } = useChat();

  const [message, setMessage] = useState('');
  const [aspect, setAspect] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_ASPECT;
    return localStorage.getItem(ASPECT_KEY) || DEFAULT_ASPECT;
  });

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const placeholder = useMemo(() => {
    const currentAgent = focusModes.find((m) => m.key === focusMode);
    const base = currentAgent?.followUpPlaceholder || 'Ask a follow-up';
    if (focusMode === 'agentSFC' && sfcExactMatch)
      return 'Search exact wording ...';
    return base;
  }, [focusMode, sfcExactMatch]);

  const persistAspectIfNeeded = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (focusMode !== 'agentImage') return;
    localStorage.setItem(ASPECT_KEY, aspect);
  }, [focusMode, aspect]);

  const submit = useCallback(() => {
    if (loading) return;

    const content = message.trim();
    if (!content) return;

    persistAspectIfNeeded();
    sendMessage(content);
    setMessage('');
  }, [loading, message, persistAspectIfNeeded, sendMessage]);

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

  const disabled = !loading && message.trim().length === 0;

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

      <div className="flex flex-row items-center justify-end mt-4">
        <SfcExactMatchToggle />
        <SfcTrainingRelatedToggle />

        {focusMode === 'agentImage' && (
          <select
            value={aspect}
            onChange={(e) => setAspect(e.target.value)}
            className="mx-2 rounded-lg border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary text-sm px-2 py-1 text-black dark:text-white"
          >
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
            <option value="3:2">3:2</option>
            <option value="594:295">594:295</option>
            <option value="295:295">295:295</option>
            <option value="952:320">952:320</option>
          </select>
        )}

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
