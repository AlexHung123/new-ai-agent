'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { AtSign, File, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useChat } from '@/lib/hooks/useChat';
import {
  atQueryAtCursor,
  filterFilesByQuery,
  insertMention,
} from '@/lib/writing/mentions';
import {
  MAX_WRITING_FILES,
  WRITING_ACCEPT,
  filterAllowedWritingFiles,
  planWritingUploads,
  writingFileLimitMessage,
  writingUnsupportedTypeMessage,
  type WritingAttachmentView,
} from '@/lib/writing/types';

export function useWritingMention(opts: {
  value: string;
  setValue: (next: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const {
    focusMode,
    writingFiles,
    mentionRequest,
    clearMentionRequest,
    uploadWritingFile,
  } = useChat();
  const [cursor, setCursor] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const enabled = focusMode === 'agentWriting';
  const at = enabled ? atQueryAtCursor(opts.value, cursor) : null;
  const matches = useMemo(
    () =>
      at
        ? filterFilesByQuery(
            writingFiles.filter((f) => f.status === 'ready'),
            at.query,
          )
        : [],
    [at, writingFiles],
  );

  useEffect(() => {
    setMenuOpen(Boolean(at) && enabled);
    setActiveIndex(0);
  }, [at?.start, at?.query, enabled]);

  const applyMention = useCallback(
    (name: string, start?: number) => {
      const el = opts.inputRef.current;
      const cur = el?.selectionStart ?? opts.value.length;
      const detected = atQueryAtCursor(opts.value, cur);
      const from = start ?? detected?.start ?? cur;
      const next = insertMention(opts.value, cur, from, name);
      opts.setValue(next.text);
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(next.cursor, next.cursor);
        setCursor(next.cursor);
      });
      setMenuOpen(false);
    },
    [opts],
  );

  useEffect(() => {
    if (!enabled || !mentionRequest) return;
    applyMention(mentionRequest);
    clearMentionRequest();
  }, [mentionRequest, enabled, applyMention, clearMentionRequest]);

  const onSelect = (file: WritingAttachmentView) => {
    applyMention(file.name);
  };

  const onAtClick = () => {
    const el = opts.inputRef.current;
    const cur = el?.selectionStart ?? opts.value.length;
    const next = opts.value.slice(0, cur) + '@' + opts.value.slice(cur);
    opts.setValue(next);
    const pos = cur + 1;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
      setCursor(pos);
    });
    setMenuOpen(true);
  };

  const atLimit = writingFiles.length >= MAX_WRITING_FILES;

  const onUploadClick = () => {
    if (atLimit) {
      toast.error(writingFileLimitMessage());
      return;
    }
    fileInputRef.current?.click();
  };

  const onFilesPicked = (list: FileList | null) => {
    if (!list) return;
    const typed = filterAllowedWritingFiles(Array.from(list));
    if (typed.rejected > 0) {
      toast.error(writingUnsupportedTypeMessage());
    }
    const { accepted, rejected } = planWritingUploads(
      writingFiles.length,
      typed.accepted,
    );
    if (rejected > 0) {
      toast.error(writingFileLimitMessage());
    }
    accepted.forEach((file) => {
      void uploadWritingFile(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!menuOpen || matches.length === 0) return false;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const file = matches[activeIndex];
      if (file) onSelect(file);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setMenuOpen(false);
      return true;
    }
    return false;
  };

  return {
    enabled,
    matches,
    menuOpen,
    activeIndex,
    setCursor,
    onKeyDown,
    onSelect,
    onAtClick,
    onUploadClick,
    fileInputRef,
    onFilesPicked,
    uploadDisabled: atLimit,
    query: at?.query ?? '',
  };
}

export function WritingAtMenu({
  matches,
  activeIndex,
  onSelect,
}: {
  matches: WritingAttachmentView[];
  activeIndex: number;
  onSelect: (file: WritingAttachmentView) => void;
}) {
  if (matches.length === 0) return null;
  return (
    <div className="writing-at-menu" role="listbox">
      <div className="writing-at-menu-label">文件 · {matches.length} 个匹配项</div>
      {matches.map((file, i) => (
        <button
          key={file.fileId}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          className={`writing-at-menu-item${i === activeIndex ? ' is-active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(file);
          }}
        >
          <File size={16} />
          <span>{file.name}</span>
        </button>
      ))}
    </div>
  );
}

export function WritingToolbarButtons({
  onAtClick,
  onUploadClick,
  fileInputRef,
  onFilesPicked,
  uploadDisabled = false,
}: {
  onAtClick: () => void;
  onUploadClick: () => void;
  fileInputRef: RefObject<HTMLInputElement | null> | RefObject<HTMLInputElement>;
  onFilesPicked: (list: FileList | null) => void;
  uploadDisabled?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        className="writing-tool-btn"
        aria-label="Mention a file"
        onClick={onAtClick}
      >
        <AtSign size={16} />
      </button>
      <button
        type="button"
        className="writing-tool-btn"
        aria-label="Upload file"
        title={uploadDisabled ? writingFileLimitMessage() : 'Upload files'}
        disabled={uploadDisabled}
        onClick={onUploadClick}
      >
        <Paperclip size={16} />
      </button>
      <input
        ref={fileInputRef as RefObject<HTMLInputElement>}
        type="file"
        multiple
        accept={WRITING_ACCEPT}
        className="hidden"
        onChange={(e) => onFilesPicked(e.target.files)}
      />
    </>
  );
}
