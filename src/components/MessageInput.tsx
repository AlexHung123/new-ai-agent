import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import {
  SFC_DOCUMENT_FOCUS_MODE,
  findDisplayFocusMode,
} from '@/lib/agents';
import SfcExactMatchToggle from './SfcExactMatchToggle';
import { HtmlSkillHint } from './HtmlSkillHint';
import {
  AttachImageControls,
  AttachedImageStrip,
  useAttachedImages,
} from './AttachImageControls';
import WritingKnowledgeAtMenu from './WritingKnowledgeAtMenu';

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
  } = useChat();

  const [message, setMessage] = useState('');
  const [cursor, setCursor] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const images = useAttachedImages(focusMode);

  const placeholder = useMemo(() => {
    const currentAgent = findDisplayFocusMode(focusMode);
    const base = currentAgent?.followUpPlaceholder || 'Ask a follow-up';
    if (focusMode === 'agentSFC' && sfcExactMatch)
      return 'Search exact wording ...';
    if (focusMode === SFC_DOCUMENT_FOCUS_MODE)
      return 'Ask a follow-up about SFC written replies…';
    return base;
  }, [focusMode, sfcExactMatch]);

  const submit = useCallback(() => {
    if (loading) return;
    if (focusMode === 'agentDocument' && !documentId) return;

    const content = message.trim();
    if (!content && images.payload.length === 0) return;

    sendMessage(content, undefined, false, images.payload);
    setMessage('');
    images.clear();
    inputRef.current?.focus();
  }, [images, loading, message, sendMessage, focusMode, documentId]);

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

  const syncCursor = useCallback(
    (el: HTMLTextAreaElement | null) => {
      if (el) setCursor(el.selectionStart ?? 0);
    },
    [],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      syncCursor(e.currentTarget);
      if (e.key === 'Enter' && !e.shiftKey) {
        if (focusMode === 'agentWriting' && message.includes('@')) {
          return;
        }
        e.preventDefault();
        submit();
      }
    },
    [focusMode, message, submit, syncCursor],
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
  const canSend =
    (message.trim().length > 0 || images.payload.length > 0) &&
    !documentBlocked;
  const disabled = loading ? false : !canSend;

  return (
    <form onSubmit={onSubmit} className="composer">
      <AttachedImageStrip images={images} />
      <div className="composer-input-wrap">
        {focusMode === 'agentWriting' ? (
          <WritingKnowledgeAtMenu
            text={message}
            cursor={cursor}
            onPick={(next) => {
              setMessage(next.text);
              setCursor(next.cursor);
              requestAnimationFrame(() => {
                const el = inputRef.current;
                if (!el) return;
                el.focus();
                el.setSelectionRange(next.cursor, next.cursor);
              });
            }}
          />
        ) : null}
        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            syncCursor(e.target);
          }}
          onSelect={(e) => syncCursor(e.currentTarget)}
          onKeyUp={(e) => syncCursor(e.currentTarget)}
          onClick={(e) => syncCursor(e.currentTarget)}
          onPaste={images.onPaste}
          onKeyDown={onKeyDown}
          className="composer-input"
          placeholder={placeholder}
          maxRows={8}
        />
      </div>

      <div className="composer-toolbar">
        <div className="composer-toolbar-left">
          <SfcExactMatchToggle />
          <AttachImageControls images={images} />
          <HtmlSkillHint />
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
