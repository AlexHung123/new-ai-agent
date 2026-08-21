import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import { focusModes } from '@/lib/agents';
import SfcExactMatchToggle from './SfcExactMatchToggle';
import {
  useWritingMention,
  WritingAtMenu,
  WritingToolbarButtons,
} from './WritingComposerTools';

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

const MessageInput = memo(function MessageInput() {
  const {
    loading,
    sendMessage,
    stop,
    focusMode,
    sfcExactMatch,
    documentId,
    writingFiles,
  } = useChat();

  const [message, setMessage] = useState('');

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const writing = useWritingMention({
    value: message,
    setValue: setMessage,
    inputRef,
  });

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
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (writing.onKeyDown(e)) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit, writing],
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
  const uploading = writingFiles.some((file) => file.status === 'uploading');
  const canSend =
    message.trim().length > 0 && !documentBlocked && !uploading;
  const disabled = loading ? false : !canSend;

  return (
    <form onSubmit={onSubmit} className="composer">
      {writing.enabled && writing.menuOpen ? (
        <WritingAtMenu
          matches={writing.matches}
          activeIndex={writing.activeIndex}
          onSelect={writing.onSelect}
        />
      ) : null}
      <TextareaAutosize
        ref={inputRef}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          writing.setCursor(e.target.selectionStart);
        }}
        onSelect={(e) => writing.setCursor(e.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
        className="composer-input"
        placeholder={placeholder}
        maxRows={8}
      />

      <div className="composer-toolbar">
        <div className="composer-toolbar-left">
          <SfcExactMatchToggle />
          {writing.enabled ? (
            <WritingToolbarButtons
              onAtClick={writing.onAtClick}
              onUploadClick={writing.onUploadClick}
              fileInputRef={writing.fileInputRef}
              onFilesPicked={writing.onFilesPicked}
            />
          ) : null}
        </div>
        <div className="composer-toolbar-right">
          <button
            disabled={disabled}
            onClick={onActionClick}
            className={
              loading
                ? 'send-btn stop-btn'
                : `send-btn${canSend ? ' send-btn-active' : ''}`
            }
            aria-label={loading ? 'Stop generating' : 'Send message'}
            type="button"
          >
            {loading ? (
              'Stop'
            ) : (
              <>
                <SendArrow />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
});

export default MessageInput;
