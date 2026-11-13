'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, PanelRight, X } from 'lucide-react';
import {
  GENERATED_IMAGE_EVENT_TYPE,
  isGeneratedImageEvent,
  type GeneratedImageEvent,
} from '@/lib/image/generatedImageEvent';
import {
  canvasPhaseLabel,
  imagePhaseLabel,
} from '@/lib/image/imageJobProtocol';
import {
  getAuthHeaders,
  getAuthToken,
  initializeAuthToken,
} from '@/lib/utils/auth';

const IMAGE_PERMISSION = 'chatImageAgent:execute';
const AGENT_TITLE = 'Agent Image';
const CHAT_ID_KEY = 'itms-agent-image-chat-id';

type JobStatus = 'queued' | 'generating' | 'succeeded' | 'failed' | 'cancelled';

type HistoryItem = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status?: JobStatus | null;
  jobId?: string;
  error?: string | null;
  imageUrl?: string | null;
};

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStoredChatId(): string {
  try {
    const existing = sessionStorage.getItem(CHAT_ID_KEY);
    if (existing && existing.trim()) return existing;
    const next = newId();
    sessionStorage.setItem(CHAT_ID_KEY, next);
    return next;
  } catch {
    return newId();
  }
}

function parseJsonLines(buffer: string) {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const jsonObjects: unknown[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      jsonObjects.push(JSON.parse(line));
    } catch (err) {
      console.warn('[Agent Image] skip invalid SSE JSON line', err);
    }
  }

  return { jsonObjects, rest };
}

function eventType(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const type = (data as { type?: unknown }).type;
  return typeof type === 'string' ? type : null;
}

const ImagePage = () => {
  const searchParams = useSearchParams();
  const [tokenReady, setTokenReady] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [canvasImage, setCanvasImage] = useState<string | null>(null);
  const [canvasStatus, setCanvasStatus] = useState<JobStatus | null>(null);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [promptHint, setPromptHint] = useState(false);
  const [sending, setSending] = useState(false);
  const historyEndRef = useRef<HTMLDivElement | null>(null);
  const chatIdRef = useRef<string>('');
  const chatHistoryRef = useRef<Array<[string, string]>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    initializeAuthToken(searchParams);
    chatIdRef.current = readStoredChatId();
    setTokenReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (!tokenReady) return;

    const loadAccess = async () => {
      try {
        const response = await fetch(`/itms/ai/api/permissions`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          setAllowed(false);
          return;
        }
        const data = await response.json();
        setAllowed(
          Array.isArray(data.permissions) &&
            data.permissions.includes(IMAGE_PERMISSION),
        );
      } catch {
        setAllowed(false);
      } finally {
        setLoadingAccess(false);
      }
    };

    void loadAccess();
  }, [tokenReady]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, sidebarOpen]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      for (const url of objectUrls.current) {
        URL.revokeObjectURL(url);
      }
      objectUrls.current.clear();
    };
  }, []);

  const rememberUrl = (url: string) => {
    objectUrls.current.add(url);
    return url;
  };

  const authHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const patchItem = (id: string, patch: Partial<HistoryItem>) => {
    setHistory((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const fetchJobImage = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error('Image could not be loaded.');
    }
    const blob = await response.blob();
    return rememberUrl(URL.createObjectURL(blob));
  };

  const handleGeneratedImage = async (
    assistantId: string,
    event: GeneratedImageEvent,
  ) => {
    if (event.status === 'queued' || event.status === 'generating') {
      setCanvasStatus(event.status);
      setCanvasError(null);
      patchItem(assistantId, { status: event.status, jobId: event.jobId });
      return;
    }
    if (event.status === 'succeeded' && event.imageUrl) {
      try {
        const blobUrl = await fetchJobImage(event.imageUrl);
        setCanvasImage(blobUrl);
        setCanvasStatus(null);
        setCanvasError(null);
        patchItem(assistantId, {
          status: 'succeeded',
          jobId: event.jobId,
          imageUrl: blobUrl,
          error: null,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Image could not be loaded.';
        setCanvasStatus(null);
        setCanvasError(message);
        patchItem(assistantId, { status: 'failed', error: message });
      }
      return;
    }
    const message = event.error || 'Image generation failed.';
    setCanvasStatus(null);
    setCanvasError(message);
    patchItem(assistantId, {
      status: event.status === 'cancelled' ? 'cancelled' : 'failed',
      error: message,
      jobId: event.jobId,
    });
  };

  const canSend = prompt.trim().length > 0 && !sending;

  const handleSend = async () => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt) {
      setPromptHint(true);
      return;
    }
    if (sending) return;

    setPromptHint(false);
    setPrompt('');
    setSending(true);
    setCanvasError(null);

    const userId = newId();
    const assistantId = newId();
    const messageId = newId();
    const chatId = chatIdRef.current || readStoredChatId();
    chatIdRef.current = chatId;

    setHistory((current) => [
      ...current,
      { id: userId, role: 'user', text: nextPrompt },
      { id: assistantId, role: 'assistant', text: '' },
    ]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let received = '';
    try {
      const response = await fetch('/itms/ai/api/chat', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'content-type': 'application/json',
          'x-chat-id': chatId,
          'x-agent-id': `image-chat-agent-${chatId}`,
        },
        body: JSON.stringify({
          content: nextPrompt,
          message: { messageId, chatId, content: nextPrompt },
          chatId,
          focusMode: 'agentImage',
          optimizationMode: 'balanced',
          history: chatHistoryRef.current,
          systemInstructions: '',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = `Chat failed (${response.status})`;
        try {
          const body = await response.json();
          if (typeof body.message === 'string' && body.message) {
            message = body.message;
          } else if (typeof body.error === 'string' && body.error) {
            message = body.error;
          }
        } catch {
          // keep fallback
        }
        setCanvasStatus(null);
        patchItem(assistantId, {
          text: message,
          status: 'failed',
          error: message,
        });
        chatHistoryRef.current = [
          ...chatHistoryRef.current,
          ['human', nextPrompt],
          ['assistant', message],
        ];
        return;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const handleEvent = async (data: unknown) => {
        const type = eventType(data);
        const record =
          data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : {};
        if (type === 'error') {
          const message =
            typeof record.data === 'string' && record.data
              ? record.data
              : 'Something went wrong.';
          setCanvasStatus(null);
          setCanvasError(message);
          patchItem(assistantId, { error: message, status: 'failed' });
          return;
        }
        if (type === 'progress') return;
        if (
          type === GENERATED_IMAGE_EVENT_TYPE &&
          isGeneratedImageEvent(record.data)
        ) {
          await handleGeneratedImage(assistantId, record.data);
          return;
        }
        if (type === 'tool_execution') {
          const tool =
            record.data && typeof record.data === 'object'
              ? (record.data as { name?: unknown; state?: unknown })
              : {};
          if (tool.name === 'generate_image') {
            if (tool.state === 'RUNNING') {
              setCanvasStatus('generating');
              setCanvasError(null);
              patchItem(assistantId, { status: 'generating' });
            }
          }
          return;
        }
        if (type === 'tool_error') {
          const tool =
            record.data && typeof record.data === 'object'
              ? (record.data as { name?: unknown; error?: unknown })
              : {};
          if (tool.name === 'generate_image') {
            const message =
              typeof tool.error === 'string' && tool.error
                ? tool.error
                : 'Image generation failed.';
            setCanvasStatus(null);
            setCanvasError(message);
            patchItem(assistantId, { status: 'failed', error: message });
          }
          return;
        }
        if (type === 'message' && typeof record.data === 'string') {
          received += record.data;
          patchItem(assistantId, { text: received });
          return;
        }
      };

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
          await handleEvent(obj);
        }
      }
      if (buffer.trim() && !controller.signal.aborted) {
        try {
          await handleEvent(JSON.parse(buffer));
        } catch (err) {
          console.warn('[Agent Image] skip leftover SSE JSON', err);
        }
      }

      chatHistoryRef.current = [
        ...chatHistoryRef.current,
        ['human', nextPrompt],
        ['assistant', received],
      ];
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Chat request failed.';
      setCanvasStatus(null);
      setCanvasError(message);
      patchItem(assistantId, {
        text: message,
        status: 'failed',
        error: message,
      });
      chatHistoryRef.current = [
        ...chatHistoryRef.current,
        ['human', nextPrompt],
        ['assistant', message],
      ];
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setSending(false);
    }
  };

  if (loadingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white/30 border-r-transparent" />
          <p className="text-white/60">Loading Agent Image...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-4">
        <div className="text-center">
          <p className="text-xl text-white/70">
            Agent Image is not available for your account.
          </p>
          <p className="mt-2 text-sm text-white/40">
            Please contact your administrator for access.
          </p>
          <Link
            href="/agents"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to agents
          </Link>
        </div>
      </div>
    );
  }

  const generating = canvasStatus === 'queued' || canvasStatus === 'generating';

  return (
    <div className="image-agent-shell fixed bottom-[var(--mobile-bottom-nav-height)] left-0 right-0 top-[var(--chat-topbar-height)] z-20 flex bg-[#0b0b0b] text-white lg:left-[72px]">
      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-14 shrink-0 items-center px-4">
          <Link
            href="/agents"
            aria-label="Back to agents"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-black shadow-sm">
              <ImageIcon size={12} />
              {AGENT_TITLE}
            </span>
          </div>
          {!sidebarOpen ? (
            <button
              type="button"
              aria-label="Open history"
              onClick={() => setSidebarOpen(true)}
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <PanelRight size={16} />
            </button>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-4">
          <div className="relative flex h-full max-h-[min(780px,calc(100%-1rem))] w-full max-w-3xl items-center justify-center overflow-hidden rounded-sm bg-[#2c2c2c]">
            {canvasImage && !generating ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={canvasImage}
                alt="Generated image"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm text-white/90 shadow-lg">
                <ImageIcon size={14} />
                {canvasError
                  ? canvasError
                  : generating
                    ? canvasPhaseLabel(canvasStatus)
                    : 'Waiting for input'}
              </span>
            )}
          </div>
        </div>

        <form
          className="shrink-0 px-6 pb-6 pt-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 ring-1 ring-white/10 focus-within:ring-white/25">
            <input
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (event.target.value.trim()) setPromptHint(false);
              }}
              aria-label="Image prompt"
              placeholder="Describe the image you want, or just say hello"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!canSend}
              className="shrink-0 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:text-white/30"
            >
              {sending
                ? generating
                  ? imagePhaseLabel(canvasStatus ?? 'generating')
                  : 'Thinking…'
                : 'Send'}
            </button>
          </div>
          {promptHint ? (
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-white/45">
              Enter a message to chat or a prompt to generate an image.
            </p>
          ) : null}
        </form>
      </section>

      {sidebarOpen ? (
        <aside className="flex w-[min(100%,22rem)] shrink-0 flex-col border-l border-white/10 bg-[#111111]">
          <header className="relative flex h-14 shrink-0 items-center px-3">
            <button
              type="button"
              aria-label="Close history"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-white/90">
                {AGENT_TITLE}
              </span>
            </div>
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
            {history.length === 0 ? (
              <p className="pt-6 text-sm leading-6 text-white/55">
                Say hello, or describe an image and I will generate it with
                ComfyUI.
              </p>
            ) : null}
            {history.map((item) =>
              item.role === 'user' ? (
                <div key={item.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl bg-[#2a2a2a] px-3 py-2 text-sm leading-6 text-white">
                    {item.text}
                  </p>
                </div>
              ) : (
                <div key={item.id} className="flex justify-start">
                  <div className="max-w-[85%] space-y-2 text-sm leading-6 text-white/85">
                    {item.imageUrl ? (
                      <button
                        type="button"
                        className="block overflow-hidden rounded-lg bg-[#2c2c2c]"
                        onClick={() => {
                          setCanvasImage(item.imageUrl ?? null);
                          setCanvasError(null);
                          setCanvasStatus(null);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt="Generated result"
                          className="h-auto w-full object-cover"
                        />
                      </button>
                    ) : null}
                    {item.text ? (
                      <p className="whitespace-pre-wrap break-words">
                        {item.text}
                      </p>
                    ) : item.status === 'queued' ||
                      item.status === 'generating' ? (
                      <p className="text-white/60">
                        {imagePhaseLabel(item.status)}
                      </p>
                    ) : null}
                    {item.error ? (
                      <p className="text-red-300">{item.error}</p>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            <div ref={historyEndRef} />
          </div>
        </aside>
      ) : null}
    </div>
  );
};

export default ImagePage;
