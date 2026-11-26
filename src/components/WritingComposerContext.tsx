'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { insertMentionAtCursor } from '@/lib/writing/mentions';

type InsertMentionToken = (token: string) => void;

type WritingComposerContextValue = {
  insertMentionToken: InsertMentionToken;
  registerInsertMention: (fn: InsertMentionToken | null) => void;
};

const WritingComposerContext = createContext<WritingComposerContextValue>({
  insertMentionToken: () => {},
  registerInsertMention: () => {},
});

export function WritingComposerProvider({ children }: { children: ReactNode }) {
  const applyRef = useRef<InsertMentionToken | null>(null);
  const registerInsertMention = useCallback((fn: InsertMentionToken | null) => {
    applyRef.current = fn;
  }, []);
  const insertMentionToken = useCallback((token: string) => {
    applyRef.current?.(token);
  }, []);
  const value = useMemo(
    () => ({ insertMentionToken, registerInsertMention }),
    [insertMentionToken, registerInsertMention],
  );
  return (
    <WritingComposerContext.Provider value={value}>
      {children}
    </WritingComposerContext.Provider>
  );
}

export function useWritingComposer() {
  return useContext(WritingComposerContext);
}

export function useRegisterWritingComposerMention(args: {
  text: string;
  cursor: number;
  inputRef: MutableRefObject<HTMLTextAreaElement | null>;
  onPick: (next: { text: string; cursor: number }) => void;
}) {
  const { registerInsertMention } = useWritingComposer();
  const argsRef = useRef(args);
  argsRef.current = args;

  const insertMentionToken = useCallback((token: string) => {
    const { text, cursor, inputRef, onPick } = argsRef.current;
    const el = inputRef.current;
    const pos =
      el && document.activeElement === el
        ? el.selectionStart ?? cursor
        : cursor;
    const next = insertMentionAtCursor(text, pos, token);
    onPick(next);
  }, []);

  useEffect(() => {
    registerInsertMention(insertMentionToken);
    return () => registerInsertMention(null);
  }, [insertMentionToken, registerInsertMention]);
}
