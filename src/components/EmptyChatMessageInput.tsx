import { useEffect, useRef, useState } from 'react';
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
import { atQueryAtCursor } from '@/lib/writing/mentions';

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

type EmptyChatMessageInputProps = {
  draft?: string;
  onDraftChange?: (value: string) => void;
};

const EmptyChatMessageInput = ({
  draft,
  onDraftChange,
}: EmptyChatMessageInputProps = {}) => {
  const { sendMessage, focusMode, sfcExactMatch, documentId } = useChat();
  const [internalMessage, setInternalMessage] = useState('');
  const message = onDraftChange ? (draft ?? '') : internalMessage;
  const setMessage = (next: string) => {
    if (onDraftChange) onDraftChange(next);
    else setInternalMessage(next);
  };
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [cursor, setCursor] = useState(0);
  const images = useAttachedImages(focusMode);
  const syncCursor = (el: HTMLTextAreaElement | null) => {
    if (el) setCursor(el.selectionStart ?? 0);
  };

  const currentAgent = findDisplayFocusMode(focusMode);
  let placeholder = currentAgent?.placeholder || 'Ask a question…';
  const documentBlocked = focusMode === 'agentDocument' && !documentId;

  if (focusMode === 'agentSFC' && sfcExactMatch) {
    placeholder = 'Search exact wording ...';
  } else if (focusMode === SFC_DOCUMENT_FOCUS_MODE) {
    placeholder = 'Ask about SFC written replies…';
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

  const canSend =
    (message.trim().length > 0 || images.payload.length > 0) &&
    !documentBlocked;

  const submit = () => {
    if (!canSend) return;
    sendMessage(message.trim(), undefined, false, images.payload);
    setMessage('');
    images.clear();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="composer"
    >
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (
                focusMode === 'agentWriting' &&
                atQueryAtCursor(message, cursor)
              ) {
                return;
              }
              e.preventDefault();
              submit();
            } else {
              syncCursor(e.currentTarget);
            }
          }}
          minRows={1}
          maxRows={8}
          className="composer-input"
          placeholder={placeholder}
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
