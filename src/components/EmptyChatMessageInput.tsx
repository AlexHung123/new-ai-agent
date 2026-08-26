import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import {
  SFC_DOCUMENT_FOCUS_MODE,
  findDisplayFocusMode,
} from '@/lib/agents';
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

const EmptyChatMessageInput = () => {
  const { sendMessage, focusMode, sfcExactMatch, documentId, writingFiles } =
    useChat();
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const writing = useWritingMention({
    value: message,
    setValue: setMessage,
    inputRef,
  });

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

  const uploading = writingFiles.some((file) => file.status === 'uploading');
  const canSend =
    message.trim().length > 0 && !documentBlocked && !uploading;

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
      className="composer"
    >
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
        onKeyDown={(e) => {
          if (writing.onKeyDown(e)) return;
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        minRows={1}
        maxRows={8}
        className="composer-input"
        placeholder={placeholder}
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
              uploadDisabled={writing.uploadDisabled}
            />
          ) : null}
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
