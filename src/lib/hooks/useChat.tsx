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
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';
import { MinimalProvider } from '../models/types';
import { extractUserIdFromToken, getAuthHeaders } from '../utils/auth';

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

export interface FileItem {
  fileName: string;
  fileExtension: string;
  fileId: string;
}

export interface ChatModelProvider {
  key: string;
  providerId: string;
}

export interface EmbeddingModelProvider {
  key: string;
  providerId: string;
}

type ChatContext = {
  messages: Message[];
  chatTurns: ChatTurn[];
  sections: Section[];
  chatHistory: [string, string][];
  files: FileItem[];
  fileIds: string[];
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
  chatModelProvider: ChatModelProvider;
  embeddingModelProvider: EmbeddingModelProvider;
  progress: ProgressData | null;
  sfcExactMatch: boolean;
  setSfcExactMatch: (exact: boolean) => void;
  sfcTrainingRelated: boolean;
  setSfcTrainingRelated: (enabled: boolean) => void;
  setOptimizationMode: (mode: string) => void;
  setFocusMode: (mode: string) => void;
  setFiles: (files: FileItem[]) => void;
  setFileIds: (fileIds: string[]) => void;
  sendMessage: (
    message: string,
    messageId?: string,
    rewrite?: boolean,
  ) => Promise<void>;
  rewrite: (messageId: string) => void;
  setChatModelProvider: (provider: ChatModelProvider) => void;
  setEmbeddingModelProvider: (provider: EmbeddingModelProvider) => void;
  stop: () => void;
  clearProgress: () => void;
};

export const chatContext = createContext<ChatContext>({
  chatHistory: [],
  chatId: '',
  userId: null,
  fileIds: [],
  files: [],
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
  chatModelProvider: { key: '', providerId: '' },
  embeddingModelProvider: { key: '', providerId: '' },
  progress: null,
  clearProgress: () => {},
  sfcExactMatch: false,
  setSfcExactMatch: () => {},
  sfcTrainingRelated: false,
  setSfcTrainingRelated: () => {},
  rewrite: () => {},
  sendMessage: async () => {},
  setFileIds: () => {},
  setFiles: () => {},
  setFocusMode: () => {},
  setOptimizationMode: () => {},
  setChatModelProvider: () => {},
  setEmbeddingModelProvider: () => {},
  stop: () => {},
});

/** -----------------------------
 * Small utilities
 * ----------------------------- */

const getPreferredModelByFocusMode = (focusMode: string) => {
  return focusMode === 'agentSurvey'
    ? 'qwen3-next-80b-a3b-instruct-mlx'
    : 'gpt-oss-120b';
};

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
    jsonObjects.push(JSON.parse(line));
  }

  return { jsonObjects, rest };
};

/** -----------------------------
 * API helpers
 * ----------------------------- */

const checkConfig = async (args: {
  setChatModelProvider: (provider: ChatModelProvider) => void;
  setEmbeddingModelProvider: (provider: EmbeddingModelProvider) => void;
  setIsConfigReady: (ready: boolean) => void;
  setHasError: (hasError: boolean) => void;
  setAvailableProviders: (providers: MinimalProvider[]) => void;
}) => {
  const {
    setChatModelProvider,
    setEmbeddingModelProvider,
    setIsConfigReady,
    setHasError,
    setAvailableProviders,
  } = args;

  try {
    let chatModelKey = safeLocalStorageGet('chatModelKey');
    let chatModelProviderId = safeLocalStorageGet('chatModelProviderId');
    let embeddingModelKey = safeLocalStorageGet('embeddingModelKey');
    let embeddingModelProviderId = safeLocalStorageGet(
      'embeddingModelProviderId',
    );

    const res = await fetch(`/itms/ai/api/providers`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(
        `Provider fetching failed with status code ${res.status}`,
      );
    }

    const data = await res.json();
    const providers: MinimalProvider[] = data.providers;
    setAvailableProviders(providers);

    if (providers.length === 0) {
      throw new Error(
        'No chat model providers found, please configure them in the settings page.',
      );
    }

    const focusMode = safeLocalStorageGet('focusMode') || 'webSearch';
    const preferredModel = getPreferredModelByFocusMode(focusMode);

    // Prefer a provider that has the preferred model for current focusMode
    let chatProvider = providers.find((p) =>
      p.chatModels.some((m) => m.key === preferredModel),
    );

    if (chatProvider) {
      chatModelKey = preferredModel;
      chatModelProviderId = chatProvider.id;
    } else {
      // fallback to saved providerId, else first provider with chatModels
      chatProvider =
        providers.find((p) => p.id === chatModelProviderId) ??
        providers.find((p) => p.chatModels.length > 0);

      if (!chatProvider) {
        throw new Error(
          'No chat models found, please configure them in the settings page.',
        );
      }

      chatModelProviderId = chatProvider.id;

      const chatModel =
        chatProvider.chatModels.find((m) => m.key === chatModelKey) ??
        chatProvider.chatModels[0];

      chatModelKey = chatModel.key;
    }

    const embeddingProvider =
      providers.find((p) => p.id === embeddingModelProviderId) ??
      providers.find((p) => p.embeddingModels.length > 0);

    if (!embeddingProvider) {
      throw new Error(
        'No embedding models found, please configure them in the settings page.',
      );
    }

    embeddingModelProviderId = embeddingProvider.id;

    const embeddingModel =
      embeddingProvider.embeddingModels.find(
        (m) => m.key === embeddingModelKey,
      ) ?? embeddingProvider.embeddingModels[0];

    embeddingModelKey = embeddingModel.key;

    safeLocalStorageSet('chatModelKey', chatModelKey);
    safeLocalStorageSet('chatModelProviderId', chatModelProviderId);
    safeLocalStorageSet('embeddingModelKey', embeddingModelKey);
    safeLocalStorageSet('embeddingModelProviderId', embeddingModelProviderId);

    setChatModelProvider({
      key: chatModelKey,
      providerId: chatModelProviderId,
    });
    setEmbeddingModelProvider({
      key: embeddingModelKey,
      providerId: embeddingModelProviderId,
    });

    setIsConfigReady(true);
  } catch (err: any) {
    console.error('An error occurred while checking the configuration:', err);
    toast.error(err?.message ?? 'Config error');
    setIsConfigReady(false);
    setHasError(true);
  }
};

const loadMessages = async (args: {
  chatId: string;
  setMessages: (messages: Message[]) => void;
  setIsMessagesLoaded: (loaded: boolean) => void;
  setChatHistory: (history: [string, string][]) => void;
  setFocusMode: (mode: string) => void;
  setNotFound: (notFound: boolean) => void;
  setFiles: (files: FileItem[]) => void;
  setFileIds: (fileIds: string[]) => void;
}) => {
  const {
    chatId,
    setMessages,
    setIsMessagesLoaded,
    setChatHistory,
    setFocusMode,
    setNotFound,
    setFiles,
    setFileIds,
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

  const files: FileItem[] = (data.chat.files ?? []).map((file: any) => ({
    fileName: file.name,
    fileExtension: file.name.split('.').pop(),
    fileId: file.fileId,
  }));

  setFiles(files);
  setFileIds(files.map((f) => f.fileId));

  setChatHistory(history);
  setFocusMode(data.chat.focusMode);
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
      const citationRegex = /\[([^\]]+)\]/g;
      const bareNumberCiteRegex = /\[(\d+)\]/g;

      if (processedMessage.includes('<think>')) {
        const openThinkTag = processedMessage.match(/<think>/g)?.length || 0;
        const closeThinkTag = processedMessage.match(/<\/think>/g)?.length || 0;
        if (openThinkTag && !closeThinkTag)
          processedMessage += '</think> <a> </a>';
      }

      if (aiMessage.content.includes('</think>')) thinkingEnded = true;

      if (sourceMessage?.sources?.length) {
        processedMessage = processedMessage.replace(
          citationRegex,
          (_, capturedContent: string) => {
            const numbers = capturedContent.split(',').map((n) => n.trim());

            return numbers
              .map((numStr) => {
                const number = Number.parseInt(numStr, 10);
                if (!Number.isFinite(number) || number <= 0)
                  return `[${numStr}]`;

                const source = sourceMessage.sources?.[number - 1];
                const url = source?.metadata?.url;
                return url
                  ? `<citation href="${url}">${numStr}</citation>`
                  : '';
              })
              .join('');
          },
        );

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
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('q'); // read-only search params hook [web:9]

  const [userId, setUserId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | undefined>(params.chatId);
  const [newChatCreated, setNewChatCreated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [fileIds, setFileIds] = useState<string[]>([]);

  const [focusMode, setFocusMode] = useState(() => {
    return safeLocalStorageGet('focusMode') || 'webSearch';
  });

  const [optimizationMode, setOptimizationMode] = useState('speed');
  const [sfcExactMatch, setSfcExactMatch] = useState(false);
  const [sfcTrainingRelated, setSfcTrainingRelated] = useState(false);

  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [chatModelProvider, setChatModelProvider] = useState<ChatModelProvider>(
    {
      key: '',
      providerId: '',
    },
  );

  const [embeddingModelProvider, setEmbeddingModelProvider] =
    useState<EmbeddingModelProvider>({
      key: '',
      providerId: '',
    });

  const [availableProviders, setAvailableProviders] = useState<
    MinimalProvider[]
  >([]);
  const [isConfigReady, setIsConfigReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Refs to avoid stale closures inside stable sendMessage
  const messagesRef = useRef<Message[]>([]);
  const chatHistoryRef = useRef(chatHistory);
  const fileIdsRef = useRef(fileIds);
  const focusModeRef = useRef(focusMode);
  const optimizationModeRef = useRef(optimizationMode);
  const sfcExactMatchRef = useRef(sfcExactMatch);
  const sfcTrainingRelatedRef = useRef(sfcTrainingRelated);
  const chatModelProviderRef = useRef(chatModelProvider);
  const embeddingModelProviderRef = useRef(embeddingModelProvider);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    fileIdsRef.current = fileIds;
  }, [fileIds]);

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
    chatModelProviderRef.current = chatModelProvider;
  }, [chatModelProvider]);

  useEffect(() => {
    embeddingModelProviderRef.current = embeddingModelProvider;
  }, [embeddingModelProvider]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const sendMessageRef = useRef<ChatContext['sendMessage'] | null>(null);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearProgress = useCallback(() => {
    setProgress(null);
  }, []);

  const handleSetFocusMode = useCallback(
    (mode: string) => {
      setFocusMode(mode);
      safeLocalStorageSet('focusMode', mode);

      const targetModel = getPreferredModelByFocusMode(mode);
      const foundProvider = availableProviders.find((p) =>
        p.chatModels.some((m) => m.key === targetModel),
      );

      if (foundProvider) {
        setChatModelProvider({
          key: targetModel,
          providerId: foundProvider.id,
        });
        safeLocalStorageSet('chatModelKey', targetModel);
        safeLocalStorageSet('chatModelProviderId', foundProvider.id);
      }
    },
    [availableProviders],
  );

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

  // Initial boot: config + userId
  useEffect(() => {
    checkConfig({
      setChatModelProvider,
      setEmbeddingModelProvider,
      setIsConfigReady,
      setHasError,
      setAvailableProviders,
    });

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
      setFiles([]);
      setFileIds([]);
      setIsMessagesLoaded(false);
      setNotFound(false);
      setNewChatCreated(false);
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
          setFocusMode(m);
          safeLocalStorageSet('focusMode', m);
        },
        setNotFound,
        setFiles,
        setFileIds,
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

  // Auto-send initial query (?q=...)
  useEffect(() => {
    if (isReady && initialMessage && isConfigReady) {
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isConfigReady, initialMessage]);

  const sendMessageImplementation: ChatContext['sendMessage'] = async (
    message,
    messageId,
    rewriteMode = false,
  ) => {
    if (loading || !message || !userId) return;

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

    // Initialize progress immediately for agentSFC to avoid UI delay
    if (focusModeRef.current === 'agentSFC') {
      const isExact = sfcExactMatchRef.current;
      setProgress({
        status: 'processing',
        total: isExact ? 1 : 2,
        current: 1,
        question: isExact ? '檢索資料源' : '正在分析問題',
        message: isExact ? '正在檢索資料源…' : '正在分析問題…',
        tasks: [
          {
            id: 1,
            question: isExact ? '檢索資料源' : '正在分析問題',
            status: 'processing',
          },
        ],
      });
    }

    let receivedMessage = '';
    let assistantAdded = false;

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
        return;
      }

      if (data.type === 'progress') {
        handleProgress(data.data as ProgressData);
        return;
      }

      if (data.type === 'sources') {
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

    try {
      const fm = focusModeRef.current;
      const outgoingFiles =
        fm === 'agentImage'
          ? [
              ...fileIdsRef.current,
              `__AGENT_IMAGE_ASPECT__:${safeLocalStorageGet('agentImageAspect') || '1:1'}`,
            ]
          : fileIdsRef.current;

      const res = await fetch('/itms/ai/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: message,
          message: { messageId: userMsgId, chatId: chatId!, content: message },
          chatId: chatId!,
          files: outgoingFiles,
          focusMode: fm,
          optimizationMode: optimizationModeRef.current,
          sfcExactMatch: sfcExactMatchRef.current,
          sfcTrainingRelated: sfcTrainingRelatedRef.current,
          history: rewriteMode
            ? chatHistoryRef.current.slice(
                0,
                messageIndex === -1 ? undefined : messageIndex,
              )
            : chatHistoryRef.current,
          chatModel: chatModelProviderRef.current,
          embeddingModel: embeddingModelProviderRef.current,
          systemInstructions: safeLocalStorageGet('systemInstructions'),
        }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const { jsonObjects, rest } = parseJsonLines(buffer);
        buffer = rest;

        for (const obj of jsonObjects) {
          await messageHandler(obj);
        }
      }

      if (buffer.trim()) {
        await messageHandler(JSON.parse(buffer));
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // ignore aborted request
      } else {
        console.error('SendMessage error:', err);
        throw err;
      }
    } finally {
      setLoading(false);
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
      files,
      fileIds,
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
      sfcExactMatch,
      setSfcExactMatch,
      sfcTrainingRelated,
      setSfcTrainingRelated,
      setFileIds,
      setFiles,
      setFocusMode: handleSetFocusMode,
      setOptimizationMode,
      rewrite,
      sendMessage,
      setChatModelProvider,
      chatModelProvider,
      embeddingModelProvider,
      setEmbeddingModelProvider,
      stop,
      clearProgress,
    }),
    [
      messages,
      chatTurns,
      sections,
      chatHistory,
      files,
      fileIds,
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
      sfcExactMatch,
      sfcTrainingRelated,
      handleSetFocusMode,
      rewrite,
      sendMessage,
      setChatModelProvider,
      chatModelProvider,
      embeddingModelProvider,
      setEmbeddingModelProvider,
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
