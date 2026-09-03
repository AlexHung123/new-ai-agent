'use client';

import {
  AssistantMessage,
  ChatTurn,
  Message,
  SourceMessage,
  SuggestionMessage,
  UserMessage,
} from '@/components/ChatWindow';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import crypto from 'crypto';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';
import {
  SFC_DOCUMENT_FOCUS_MODE,
  SFC_DOCUMENT_ID,
  resolveFocusMode,
  resolveLoadedFocusMode,
  shouldPersistFocusMode,
} from '../agents';
import { assistantContentAfterAbort } from '../chat/abortedReply';
import {
  applyProcessDone,
  applyProgressMessage,
  createInitialProcess,
  type AgentProcessState,
} from '../chat/agentProcess';
import { applySseProcessEvent } from '../chat/applySseProcessEvent';
import { initialChatQuery } from '../chat/initialChatQuery';
import { takePendingInitialChatMessage } from '../chat/pendingInitialMessage';
import { messageFromChatHttpError } from '../chat/readChatHttpError';
import {
  extractUserIdFromToken,
  getAuthBearerHeaders,
  getAuthHeaders,
  initializeAuthToken,
} from '../utils/auth';
import {
  isAllowedWritingFilename,
  writingUnsupportedTypeMessage,
  type WritingAttachmentView,
} from '../writing/types';

export type Section = {
  userMessage: UserMessage;
  assistantMessage: AssistantMessage | undefined;
  parsedAssistantMessage: string | undefined;
  speechMessage: string | undefined;
  sourceMessage: SourceMessage | undefined;
  thinkingEnded: boolean;
  suggestions?: string[];
};

export type ProgressTask = {
  id: number;
  question: string;
  status: 'completed' | 'processing';
};

export type ProgressData = {
  status: 'started' | 'processing' | 'reassigning' | 'completed';
  total: number;
  current: number;
  question?: string;
  message: string;
  tasks?: ProgressTask[];
};

type ChatContext = {
  messages: Message[];
  chatTurns: ChatTurn[];
  sections: Section[];
  chatHistory: [string, string][];
  focusMode: string;
  chatId: string | undefined;
  userId: string | null;
  optimizationMode: string;
  isMessagesLoaded: boolean;
  loading: boolean;
  notFound: boolean;
  messageAppeared: boolean;
  isReady: boolean;
  hasError: boolean;
  progress: ProgressData | null;
  agentProcess: AgentProcessState | null;
  sfcExactMatch: boolean;
  setSfcExactMatch: (exact: boolean) => void;
  sfcTrainingRelated: boolean;
  setSfcTrainingRelated: (enabled: boolean) => void;
  setOptimizationMode: (mode: string) => void;
  setFocusMode: (mode: string) => void;
  documentId: string | null;
  setDocumentId: (id: string | null) => void;
  documentItems: Array<{ id: string; title: string; description: string }>;
  writingFiles: WritingAttachmentView[];
  refreshWritingFiles: () => Promise<void>;
  uploadWritingFile: (file: File) => Promise<void>;
  removeWritingFile: (fileId: string) => Promise<void>;
  mentionRequest: string | null;
  requestMention: (name: string) => void;
  clearMentionRequest: () => void;
  sendMessage: (
    message: string,
    messageId?: string,
    rewrite?: boolean,
  ) => Promise<void>;
  rewrite: (messageId: string) => void;
  stop: () => void;
  clearProgress: () => void;
};

export const chatContext = createContext<ChatContext>({
  chatHistory: [],
  chatId: '',
  userId: null,
  focusMode: '',
  hasError: false,
  isMessagesLoaded: false,
  isReady: false,
  loading: false,
  messageAppeared: false,
  messages: [],
  chatTurns: [],
  sections: [],
  notFound: false,
  optimizationMode: '',
  progress: null,
  agentProcess: null,
  clearProgress: () => {},
  sfcExactMatch: true,
  setSfcExactMatch: () => {},
  sfcTrainingRelated: false,
  setSfcTrainingRelated: () => {},
  rewrite: () => {},
  sendMessage: async () => {},
  setFocusMode: () => {},
  setOptimizationMode: () => {},
  documentId: null,
  setDocumentId: () => {},
  documentItems: [],
  writingFiles: [],
  refreshWritingFiles: async () => {},
  uploadWritingFile: async () => {},
  removeWritingFile: async () => {},
  mentionRequest: null,
  requestMention: () => {},
  clearMentionRequest: () => {},
  stop: () => {},
});

/** -----------------------------
 * Small utilities
 * ----------------------------- */

const safeLocalStorageGet = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const parseJsonLines = (buffer: string) => {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const jsonObjects: any[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      jsonObjects.push(JSON.parse(line));
    } catch (err) {
      // One corrupt NDJSON line (e.g. oversized tool payload) must not kill
      // the rest of the stream — otherwise message/summary chunks are lost.
      console.warn(
        '[useChat] skip invalid SSE JSON line',
        err,
        line.slice(0, 200),
      );
    }
  }

  return { jsonObjects, rest };
};

/** -----------------------------
 * API helpers
 * ----------------------------- */

const loadMessages = async (args: {
  chatId: string;
  setMessages: (messages: Message[]) => void;
  setIsMessagesLoaded: (loaded: boolean) => void;
  setChatHistory: (history: [string, string][]) => void;
  setFocusMode: (mode: string) => void;
  setNotFound: (notFound: boolean) => void;
  setDocumentId: (id: string | null) => void;
}) => {
  const {
    chatId,
    setMessages,
    setIsMessagesLoaded,
    setChatHistory,
    setFocusMode,
    setNotFound,
    setDocumentId,
  } = args;

  const res = await fetch(`/itms/ai/api/chats/${chatId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (res.status === 404) {
    setNotFound(true);
    setIsMessagesLoaded(true);
    return;
  }

  const data = await res.json();
  const messages = data.messages as Message[];
  setMessages(messages);

  const chatTurns = messages.filter(
    (msg): msg is ChatTurn => msg.role === 'user' || msg.role === 'assistant',
  );

  const history = chatTurns.map((msg) => [msg.role, msg.content]) as [
    string,
    string,
  ][];
  if (chatTurns.length > 0) document.title = chatTurns[0].content;

  setChatHistory(history);
  const resolvedFocus = resolveLoadedFocusMode(data.chat.focusMode);
  setFocusMode(resolvedFocus);
  setDocumentId(
    typeof data.chat.documentId === 'string' && data.chat.documentId
      ? data.chat.documentId
      : resolvedFocus === SFC_DOCUMENT_FOCUS_MODE
        ? SFC_DOCUMENT_ID
        : null,
  );
  setIsMessagesLoaded(true);
};

/** -----------------------------
 * Derived data builders
 * ----------------------------- */

const buildSections = (messages: Message[]): Section[] => {
  const sections: Section[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const nextUserMessageIndex = messages.findIndex(
      (m, j) => j > i && m.role === 'user',
    );

    const aiMessage = messages.find(
      (m, j) =>
        j > i &&
        m.role === 'assistant' &&
        (nextUserMessageIndex === -1 || j < nextUserMessageIndex),
    ) as AssistantMessage | undefined;

    const sourceMessage = messages.find(
      (m, j) =>
        j > i &&
        m.role === 'source' &&
        (m as SourceMessage).sources &&
        (nextUserMessageIndex === -1 || j < nextUserMessageIndex),
    ) as SourceMessage | undefined;

    let thinkingEnded = false;
    let processedMessage = aiMessage?.content ?? '';
    let speechMessage = aiMessage?.content ?? '';
    let suggestions: string[] = [];

    if (aiMessage) {
      const bareNumberCiteRegex = /\[(\d+)\]/g;

      if (processedMessage.includes('<think>')) {
        const openThinkTag = processedMessage.match(/<think>/g)?.length || 0;
        const closeThinkTag = processedMessage.match(/<\/think>/g)?.length || 0;
        if (openThinkTag && !closeThinkTag)
          processedMessage += '</think> <a> </a>';
      }

      if (aiMessage.content.includes('</think>')) thinkingEnded = true;

      if (sourceMessage?.sources?.length) {
        speechMessage = aiMessage.content.replace(bareNumberCiteRegex, '');
      } else {
        processedMessage = processedMessage.replace(bareNumberCiteRegex, '');
        speechMessage = aiMessage.content.replace(bareNumberCiteRegex, '');
      }

      const suggestionMessage = messages.find(
        (m, j) =>
          j > i &&
          m.role === 'suggestion' &&
          (nextUserMessageIndex === -1 || j < nextUserMessageIndex),
      ) as SuggestionMessage | undefined;

      if (suggestionMessage?.suggestions?.length)
        suggestions = suggestionMessage.suggestions;
    }

    sections.push({
      userMessage: msg,
      assistantMessage: aiMessage,
      sourceMessage,
      parsedAssistantMessage: processedMessage,
      speechMessage,
      thinkingEnded,
      suggestions,
    });
  }

  return sections;
};

/** -----------------------------
 * Provider
 * ----------------------------- */

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const params: { chatId: string } = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialMessage = initialChatQuery(pathname, searchParams.get('q'));

  const [userId, setUserId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | undefined>(params.chatId);
  const [newChatCreated, setNewChatCreated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [agentProcess, setAgentProcess] = useState<AgentProcessState | null>(
    null,
  );

  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [focusMode, setFocusMode] = useState(() => {
    return resolveFocusMode(safeLocalStorageGet('focusMode'));
  });

  const [optimizationMode, setOptimizationMode] = useState('speed');
  const [sfcExactMatch, setSfcExactMatch] = useState(
    () => resolveFocusMode(safeLocalStorageGet('focusMode')) === 'agentSFC',
  );
  const [sfcTrainingRelated, setSfcTrainingRelated] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(() =>
    resolveFocusMode(safeLocalStorageGet('focusMode')) === SFC_DOCUMENT_FOCUS_MODE
      ? SFC_DOCUMENT_ID
      : null,
  );
  const [documentItems, setDocumentItems] = useState<
    Array<{ id: string; title: string; description: string }>
  >([]);
  const [writingFiles, setWritingFiles] = useState<WritingAttachmentView[]>(
    [],
  );
  const [mentionRequest, setMentionRequest] = useState<string | null>(null);

  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [isConfigReady] = useState(true);
  const hasError = false;
  const [isReady, setIsReady] = useState(false);

  // Refs to avoid stale closures inside stable sendMessage
  const messagesRef = useRef<Message[]>([]);
  const chatHistoryRef = useRef(chatHistory);
  const focusModeRef = useRef(focusMode);
  const optimizationModeRef = useRef(optimizationMode);
  const sfcExactMatchRef = useRef(sfcExactMatch);
  const sfcTrainingRelatedRef = useRef(sfcTrainingRelated);
  const documentIdRef = useRef(documentId);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    focusModeRef.current = focusMode;
  }, [focusMode]);

  useEffect(() => {
    optimizationModeRef.current = optimizationMode;
  }, [optimizationMode]);

  useEffect(() => {
    sfcExactMatchRef.current = sfcExactMatch;
  }, [sfcExactMatch]);

  useEffect(() => {
    sfcTrainingRelatedRef.current = sfcTrainingRelated;
  }, [sfcTrainingRelated]);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  useEffect(() => {
    if (focusMode !== 'agentDocument') return;
    let cancelled = false;
    fetch('/itms/ai/api/documents', { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        setDocumentItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setDocumentItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [focusMode]);

  const refreshWritingFiles = useCallback(async () => {
    if (focusModeRef.current !== 'agentWriting') {
      setWritingFiles([]);
      return;
    }
    try {
      const res = await fetch('/itms/ai/api/writing/files', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setWritingFiles([]);
        return;
      }
      const data = await res.json();
      setWritingFiles(Array.isArray(data.items) ? data.items : []);
    } catch {
      setWritingFiles([]);
    }
  }, []);

  useEffect(() => {
    if (focusMode !== 'agentWriting' || !userId) {
      if (focusMode !== 'agentWriting') setWritingFiles([]);
      return;
    }
    void refreshWritingFiles();
  }, [focusMode, userId, refreshWritingFiles]);

  const uploadWritingFile = useCallback(async (file: File) => {
    if (!isAllowedWritingFilename(file.name)) {
      toast.error(writingUnsupportedTypeMessage());
      return;
    }
    const tempId = `tmp-${crypto.randomBytes(4).toString('hex')}`;
    setWritingFiles((prev) => [
      ...prev,
      {
        fileId: tempId,
        name: file.name,
        status: 'uploading',
        sizeBytes: file.size,
      },
    ]);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/itms/ai/api/writing/files', {
        method: 'POST',
        headers: getAuthBearerHeaders(),
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || 'Could not upload file');
        setWritingFiles((prev) => prev.filter((f) => f.fileId !== tempId));
        return;
      }
      setWritingFiles((prev) => [
        ...prev.filter((f) => f.fileId !== tempId),
        data.item,
      ]);
    } catch {
      toast.error('Could not upload file');
      setWritingFiles((prev) => prev.filter((f) => f.fileId !== tempId));
    }
  }, []);

  const removeWritingFile = useCallback(async (fileId: string) => {
    setWritingFiles((list) => list.filter((f) => f.fileId !== fileId));
    try {
      const res = await fetch(
        `/itms/ai/api/writing/files?fileId=${encodeURIComponent(fileId)}`,
        { method: 'DELETE', headers: getAuthHeaders() },
      );
      if (!res.ok) {
        toast.error('Could not delete file');
        void refreshWritingFiles();
      }
    } catch {
      toast.error('Could not delete file');
      void refreshWritingFiles();
    }
  }, [refreshWritingFiles]);

  const requestMention = useCallback((name: string) => {
    setMentionRequest(name);
  }, []);

  const clearMentionRequest = useCallback(() => {
    setMentionRequest(null);
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);
  const sendMessageRef = useRef<ChatContext['sendMessage'] | null>(null);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAgentProcess((prev) => applyProcessDone(prev));
  }, []);

  const clearProgress = useCallback(() => {
    setProgress(null);
  }, []);

  const handleSetFocusMode = useCallback((mode: string) => {
    const resolved = resolveFocusMode(mode);
    setFocusMode(resolved);
    safeLocalStorageSet('focusMode', resolved);
    setDocumentId(resolved === SFC_DOCUMENT_FOCUS_MODE ? SFC_DOCUMENT_ID : null);
  }, []);

  const chatTurns = useMemo((): ChatTurn[] => {
    return messages.filter(
      (msg): msg is ChatTurn => msg.role === 'user' || msg.role === 'assistant',
    );
  }, [messages]);

  const sections = useMemo(() => buildSections(messages), [messages]);

  const ensureAssistantMessage = useCallback(
    (msgId: string) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) => m.role === 'assistant' && m.messageId === msgId,
        );
        if (exists) return prev;

        return [
          ...prev,
          {
            content: '',
            messageId: msgId,
            chatId: chatId!,
            role: 'assistant',
            createdAt: new Date(),
          },
        ];
      });
    },
    [chatId],
  );

  const appendAssistantChunk = useCallback((msgId: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.role === 'assistant' && m.messageId === msgId) {
          return { ...m, content: (m.content ?? '') + chunk };
        }
        return m;
      }),
    );
  }, []);

  // Initial boot: auth token only. Chat model comes from data/config.json on the server.
  useEffect(() => {
    initializeAuthToken(searchParams);
    const extractedUserId = extractUserIdFromToken();
    setUserId(extractedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // chatId changes (route changes)
  useEffect(() => {
    if (params.chatId && params.chatId !== chatId) {
      setChatId(params.chatId);
      setMessages([]);
      setChatHistory([]);
      setIsMessagesLoaded(false);
      setNotFound(false);
      setNewChatCreated(false);
      setDocumentId(null);
    }
  }, [params.chatId, chatId]);

  // load existing chat messages or create new chat id
  useEffect(() => {
    if (
      chatId &&
      userId &&
      !newChatCreated &&
      !isMessagesLoaded &&
      messages.length === 0
    ) {
      loadMessages({
        chatId,
        setMessages,
        setIsMessagesLoaded,
        setChatHistory,
        setFocusMode: (m) => {
          const resolved = resolveLoadedFocusMode(m);
          setFocusMode(resolved);
          if (shouldPersistFocusMode(resolved)) {
            safeLocalStorageSet('focusMode', resolved);
          }
          setSfcExactMatch(resolved === 'agentSFC');
        },
        setNotFound,
        setDocumentId,
      });
      return;
    }

    if (!chatId) {
      setNewChatCreated(true);
      setIsMessagesLoaded(true);
      setChatId(crypto.randomBytes(20).toString('hex'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, userId, isMessagesLoaded, newChatCreated, messages.length]);

  useEffect(() => {
    setIsReady(Boolean(isMessagesLoaded && isConfigReady));
  }, [isMessagesLoaded, isConfigReady]);

  const rewrite = useCallback(
    (messageId: string) => {
      const index = messagesRef.current.findIndex(
        (msg) => msg.messageId === messageId,
      );
      const chatTurnsIndex = chatTurns.findIndex(
        (msg) => msg.messageId === messageId,
      );
      if (index === -1) return;

      const prevUserTurn = chatTurns[chatTurnsIndex - 1];
      if (!prevUserTurn) return;

      setMessages((prev) => {
        const cutIndex = prev.findIndex(
          (m) => m.messageId === prevUserTurn.messageId,
        );
        return prev.slice(0, Math.max(0, cutIndex));
      });

      setChatHistory((prev) => prev.slice(0, Math.max(0, chatTurnsIndex - 1)));

      sendMessage(prevUserTurn.content, prevUserTurn.messageId, true);
    },
    [chatTurns],
  );

  // Auto-send initial query (?q=...) or a stashed prompt from another tool
  useEffect(() => {
    if (!isReady || !isConfigReady) return;
    const message =
      initialMessage ?? takePendingInitialChatMessage(pathname);
    if (message) sendMessage(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isConfigReady, initialMessage, pathname]);

  const sendMessageImplementation: ChatContext['sendMessage'] = async (
    message,
    messageId,
    rewriteMode = false,
  ) => {
    if (loading || !message || !userId) return;
    if (
      focusModeRef.current === 'agentDocument' &&
      !documentIdRef.current
    ) {
      return;
    }

    setLoading(true);
    setMessageAppeared(false);
    clearProgress();

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (messagesRef.current.length <= 1) {
      window.history.replaceState(null, '', `/itms/ai/c/${chatId}`);
    }

    const userMsgId = messageId ?? crypto.randomBytes(7).toString('hex');
    setMessages((prev) => [
      ...prev,
      {
        content: message,
        messageId: userMsgId,
        chatId: chatId!,
        role: 'user',
        createdAt: new Date(),
      },
    ]);

    let process = createInitialProcess(userMsgId);
    if (focusModeRef.current === 'agentSFC') {
      const isExact = sfcExactMatchRef.current;
      const sfcMessage = isExact ? '正在檢索資料源…' : '正在分析問題…';
      process = applyProgressMessage(process, sfcMessage) ?? process;
      setProgress({
        status: 'processing',
        total: isExact ? 1 : 2,
        current: 1,
        question: isExact ? '檢索資料源' : '正在分析問題',
        message: sfcMessage,
        tasks: [
          {
            id: 1,
            question: isExact ? '檢索資料源' : '正在分析問題',
            status: 'processing',
          },
        ],
      });
    }
    setAgentProcess(process);

    let receivedMessage = '';
    let assistantAdded = false;
    let assistantMsgId = '';
    let completed = false;

    const handleProgress = (incoming: ProgressData) => {
      setProgress((prevProgress) => {
        const tasks: ProgressTask[] = prevProgress?.tasks ?? [];
        if (incoming.question && incoming.current > 0) {
          const exists = tasks.some((t) => t.id === incoming.current);
          if (!exists) {
            const updatedTasks: ProgressTask[] = tasks.map((t) => ({
              ...t,
              status: 'completed',
            }));
            updatedTasks.push({
              id: incoming.current,
              question: incoming.question!,
              status: 'processing',
            });
            return { ...incoming, tasks: updatedTasks };
          }
        }
        return { ...incoming, tasks };
      });
    };

    const messageHandler = async (data: any) => {
      if (data.type === 'error') {
        toast.error(data.data);
        setLoading(false);
        setAgentProcess((prev) => applyProcessDone(prev));
        return;
      }

      setAgentProcess((prev) => applySseProcessEvent(prev, data));

      if (data.type === 'progress') {
        handleProgress(data.data as ProgressData);
        return;
      }

      if (data.type === 'tool_execution') {
        return;
      }

      if (data.type === 'tool_error') {
        // Tool failure can be recoverable. Keep stream alive so fallback text
        // from the same turn (e.g. "No related source found.") can still arrive.
        toast.error(
          `Tool execution failed: ${data.data.error || 'Unknown error'}`,
        );
        return;
      }

      if (data.type === 'monitor_error') {
        toast.error(
          `Agent execution failed: ${data.data.error || 'Unknown error'}`,
        );
        setLoading(false);
        clearProgress();
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        return;
      }

      if (data.type === 'sources') {
        const sourceCount = Array.isArray(data.data) ? data.data.length : 0;
        setAgentProcess((prev) =>
          prev ? { ...prev, sourceCount } : prev,
        );
        setMessages((prev) => [
          ...prev,
          {
            messageId: data.messageId,
            chatId: chatId!,
            role: 'source',
            sources: data.data,
            createdAt: new Date(),
          },
        ]);
        if (data.data?.length > 0) setMessageAppeared(true);
        return;
      }

      if (data.type === 'message') {
        assistantMsgId = data.messageId;
        if (!assistantAdded) {
          ensureAssistantMessage(data.messageId);
          assistantAdded = true;
          setMessageAppeared(true);
        }
        appendAssistantChunk(data.messageId, data.data);
        receivedMessage += data.data;
        return;
      }

      if (data.type === 'messageEnd') {
        completed = true;
        setChatHistory((prev) => [
          ...prev,
          ['human', message],
          ['assistant', receivedMessage],
        ]);

        setLoading(false);
        clearProgress();

        const userMessageIndex = messagesRef.current.findIndex(
          (m) => m.messageId === userMsgId && m.role === 'user',
        );

        const sourceMessage = messagesRef.current.find(
          (m, i) => i > userMessageIndex && m.role === 'source',
        ) as SourceMessage | undefined;

        const suggestionMessageIndex = messagesRef.current.findIndex(
          (m, i) => i > userMessageIndex && m.role === 'suggestion',
        );

        if (
          (sourceMessage?.sources?.length ?? 0) > 0 &&
          suggestionMessageIndex === -1
        ) {
          const suggestions = await getSuggestions(messagesRef.current);
          setMessages((prev) => [
            ...prev,
            {
              role: 'suggestion',
              suggestions,
              chatId: chatId!,
              createdAt: new Date(),
              messageId: crypto.randomBytes(7).toString('hex'),
            },
          ]);
        }
      }
    };

    const messageIndex = messagesRef.current.findIndex(
      (m) => m.messageId === userMsgId,
    );

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const onAbort = () => {
      void reader?.cancel().catch(() => undefined);
    };
    controller.signal.addEventListener('abort', onAbort);

    try {
      const fm = focusModeRef.current;
      const stableAgentId =
        fm === SFC_DOCUMENT_FOCUS_MODE
          ? `sfc-doc-chat-agent-${chatId}`
          : `sfc-chat-agent-${chatId}`;
      const boundDocumentId =
        fm === SFC_DOCUMENT_FOCUS_MODE
          ? SFC_DOCUMENT_ID
          : documentIdRef.current ?? undefined;

      const res = await fetch('/itms/ai/api/chat', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'x-chat-id': chatId!,
          'x-agent-id': stableAgentId,
        },
        body: JSON.stringify({
          content: message,
          message: { messageId: userMsgId, chatId: chatId!, content: message },
          chatId: chatId!,
          focusMode: fm,
          optimizationMode: optimizationModeRef.current,
          sfcExactMatch: sfcExactMatchRef.current,
          sfcTrainingRelated: sfcTrainingRelatedRef.current,
          documentId: boundDocumentId,
          history: rewriteMode
            ? chatHistoryRef.current.slice(
                0,
                messageIndex === -1 ? undefined : messageIndex,
              )
            : chatHistoryRef.current,
          systemInstructions: safeLocalStorageGet('systemInstructions'),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        const msg = messageFromChatHttpError(text, res.status);
        toast.error(msg);
        const msgId = crypto.randomBytes(7).toString('hex');
        setMessages((prev) => [
          ...prev,
          {
            content: msg,
            messageId: msgId,
            chatId: chatId!,
            role: 'assistant',
            createdAt: new Date(),
          },
        ]);
        setChatHistory((prev) => [
          ...prev,
          ['human', message],
          ['assistant', msg],
        ]);
        completed = true;
        return;
      }

      if (!res.body) throw new Error('No response body');

      reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        if (controller.signal.aborted) {
          await reader.cancel().catch(() => undefined);
          break;
        }
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const { jsonObjects, rest } = parseJsonLines(buffer);
        buffer = rest;

        for (const obj of jsonObjects) {
          await messageHandler(obj);
        }
      }

      if (buffer.trim() && !controller.signal.aborted) {
        try {
          await messageHandler(JSON.parse(buffer));
        } catch (err) {
          console.warn('[useChat] skip leftover SSE JSON', err);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // User clicked Stop — finalize below like pi-rag.
      } else {
        console.error('SendMessage error:', err);
        throw err;
      }
    } finally {
      controller.signal.removeEventListener('abort', onAbort);
      if (controller.signal.aborted && !completed) {
        const content = assistantContentAfterAbort(receivedMessage);
        const msgId = assistantMsgId || crypto.randomBytes(7).toString('hex');
        if (!assistantAdded) {
          setMessages((prev) => [
            ...prev,
            {
              content,
              messageId: msgId,
              chatId: chatId!,
              role: 'assistant',
              createdAt: new Date(),
            },
          ]);
        } else if (!receivedMessage.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.role === 'assistant' && m.messageId === msgId
                ? { ...m, content }
                : m,
            ),
          );
        }
        setChatHistory((prev) => [
          ...prev,
          ['human', message],
          ['assistant', content],
        ]);
      }
      setLoading(false);
      setAgentProcess((prev) =>
        prev?.status === 'running' ? applyProcessDone(prev) : prev,
      );
    }
  };

  // keep latest impl in ref
  sendMessageRef.current = sendMessageImplementation;

  // stable sendMessage wrapper
  const sendMessage: ChatContext['sendMessage'] = useCallback((...args) => {
    return sendMessageRef.current!(...args);
  }, []);

  const contextValue = useMemo(
    () => ({
      messages,
      chatTurns,
      sections,
      chatHistory,
      focusMode,
      chatId,
      userId,
      hasError,
      isMessagesLoaded,
      isReady,
      loading,
      messageAppeared,
      notFound,
      optimizationMode,
      progress,
      agentProcess,
      sfcExactMatch,
      setSfcExactMatch,
      sfcTrainingRelated,
      setSfcTrainingRelated,
      setFocusMode: handleSetFocusMode,
      setOptimizationMode,
      documentId,
      setDocumentId,
      documentItems,
      writingFiles,
      refreshWritingFiles,
      uploadWritingFile,
      removeWritingFile,
      mentionRequest,
      requestMention,
      clearMentionRequest,
      rewrite,
      sendMessage,
      stop,
      clearProgress,
    }),
    [
      messages,
      chatTurns,
      sections,
      chatHistory,
      focusMode,
      chatId,
      userId,
      hasError,
      isMessagesLoaded,
      isReady,
      loading,
      messageAppeared,
      notFound,
      optimizationMode,
      progress,
      agentProcess,
      sfcExactMatch,
      sfcTrainingRelated,
      documentId,
      documentItems,
      writingFiles,
      refreshWritingFiles,
      uploadWritingFile,
      removeWritingFile,
      mentionRequest,
      requestMention,
      clearMentionRequest,
      handleSetFocusMode,
      rewrite,
      sendMessage,
      stop,
      clearProgress,
    ],
  );

  return (
    <chatContext.Provider value={contextValue}>{children}</chatContext.Provider>
  );
};

export const useChat = () => {
  return useContext(chatContext);
};
