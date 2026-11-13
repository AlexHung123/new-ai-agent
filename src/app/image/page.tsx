'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, PanelRight, X } from 'lucide-react';
import {
  canvasPhaseLabel,
  IMAGE_POLL_MS,
  imagePhaseLabel,
  isTerminalImageStatus,
} from '@/lib/image/imageJobProtocol';
import {
  getAuthHeaders,
  getAuthToken,
  initializeAuthToken,
} from '@/lib/utils/auth';

const IMAGE_PERMISSION = 'chatImageAgent:execute';
const AGENT_TITLE = 'Agent Image';

type JobStatus = 'queued' | 'generating' | 'succeeded' | 'failed' | 'cancelled';

type HistoryTurn = {
  id: string;
  prompt: string;
  status: JobStatus;
  jobId?: string;
  error?: string | null;
  imageUrl?: string | null;
};

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
  const [history, setHistory] = useState<HistoryTurn[]>([]);
  const [promptHint, setPromptHint] = useState(false);
  const historyEndRef = useRef<HTMLDivElement | null>(null);
  const runId = useRef(0);
  const activeJobId = useRef<string | null>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    initializeAuthToken(searchParams);
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
      runId.current += 1;
      const jobId = activeJobId.current;
      activeJobId.current = null;
      if (jobId) {
        const token = getAuthToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        void fetch(`/itms/ai/api/image/jobs/${jobId}`, {
          method: 'DELETE',
          headers,
          keepalive: true,
        });
      }
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

  const readError = async (response: Response, fallback: string) => {
    try {
      const body = await response.json();
      if (typeof body.error === 'string' && body.error) return body.error;
    } catch {
      // keep fallback
    }
    return fallback;
  };

  const fetchJobImage = async (jobId: string): Promise<string> => {
    const response = await fetch(
      `/itms/ai/api/image/view?jobId=${encodeURIComponent(jobId)}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, 'Image could not be loaded.'));
    }
    const blob = await response.blob();
    return rememberUrl(URL.createObjectURL(blob));
  };

  const updateTurn = (id: string, patch: Partial<HistoryTurn>) => {
    setHistory((current) =>
      current.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)),
    );
  };

  const generating = canvasStatus === 'queued' || canvasStatus === 'generating';
  const canGenerate = prompt.trim().length > 0 && !generating;

  const handleGenerate = async () => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt) {
      setPromptHint(true);
      return;
    }
    if (generating) return;

    setPromptHint(false);
    setPrompt('');
    setCanvasError(null);
    setCanvasStatus('queued');

    const turnId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setHistory((current) => [
      ...current,
      { id: turnId, prompt: nextPrompt, status: 'queued' },
    ]);

    const thisRun = ++runId.current;
    try {
      const created = await fetch('/itms/ai/api/image/generate', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ prompt: nextPrompt }),
      });
      if (!created.ok) {
        const message = await readError(
          created,
          `Generation failed (${created.status})`,
        );
        if (thisRun !== runId.current) return;
        setCanvasStatus(null);
        setCanvasError(message);
        updateTurn(turnId, { status: 'failed', error: message });
        return;
      }
      const body = await created.json();
      const jobId = typeof body.jobId === 'string' ? body.jobId : '';
      if (!jobId) {
        const message = 'Image service returned an invalid job.';
        setCanvasStatus(null);
        setCanvasError(message);
        updateTurn(turnId, { status: 'failed', error: message });
        return;
      }

      activeJobId.current = jobId;
      updateTurn(turnId, { jobId, status: 'queued' });

      while (thisRun === runId.current) {
        const polled = await fetch(`/itms/ai/api/image/jobs/${jobId}`, {
          headers: authHeaders(),
          cache: 'no-store',
        });
        if (!polled.ok) {
          const message = await readError(
            polled,
            `Generation failed (${polled.status})`,
          );
          if (thisRun !== runId.current) return;
          activeJobId.current = null;
          setCanvasStatus(null);
          setCanvasError(message);
          updateTurn(turnId, { status: 'failed', error: message });
          return;
        }
        const view = await polled.json();
        const status =
          typeof view.status === 'string' ? view.status : 'generating';
        if (thisRun !== runId.current) return;

        if (status === 'succeeded') {
          const imageUrl = await fetchJobImage(jobId);
          if (thisRun !== runId.current) return;
          activeJobId.current = null;
          setCanvasImage(imageUrl);
          setCanvasStatus(null);
          setCanvasError(null);
          updateTurn(turnId, { status: 'succeeded', imageUrl });
          return;
        }

        if (isTerminalImageStatus(status)) {
          const message =
            typeof view.error === 'string' && view.error
              ? view.error
              : 'Image generation failed.';
          activeJobId.current = null;
          setCanvasStatus(null);
          setCanvasError(message);
          updateTurn(turnId, { status: status as JobStatus, error: message });
          return;
        }

        setCanvasStatus(status === 'queued' ? 'queued' : 'generating');
        updateTurn(turnId, {
          status: status === 'queued' ? 'queued' : 'generating',
        });
        await new Promise((resolve) => setTimeout(resolve, IMAGE_POLL_MS));
      }
    } catch {
      if (thisRun !== runId.current) return;
      activeJobId.current = null;
      const message = 'ComfyUI server is not reachable.';
      setCanvasStatus(null);
      setCanvasError(message);
      updateTurn(turnId, { status: 'failed', error: message });
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
            void handleGenerate();
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
              placeholder="Describe the image you want to generate"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
              disabled={generating}
            />
            <button
              type="submit"
              disabled={!canGenerate}
              className="shrink-0 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:text-white/30"
            >
              {generating
                ? imagePhaseLabel(canvasStatus ?? 'generating')
                : 'Generate'}
            </button>
          </div>
          {promptHint ? (
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-white/45">
              Enter a prompt to generate an image.
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
                Describe an image and I will generate it with ComfyUI.
              </p>
            ) : null}
            {history.map((turn) => (
              <div key={turn.id} className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl bg-[#2a2a2a] px-3 py-2 text-sm leading-6 text-white">
                    {turn.prompt}
                  </p>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] text-sm leading-6 text-white/85">
                    {turn.status === 'succeeded' && turn.imageUrl ? (
                      <button
                        type="button"
                        className="block overflow-hidden rounded-lg bg-[#2c2c2c]"
                        onClick={() => {
                          setCanvasImage(turn.imageUrl ?? null);
                          setCanvasError(null);
                          setCanvasStatus(null);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={turn.imageUrl}
                          alt="Generated result"
                          className="h-auto w-full object-cover"
                        />
                      </button>
                    ) : turn.status === 'failed' ||
                      turn.status === 'cancelled' ? (
                      <p className="text-red-300">
                        {turn.error || 'Image generation failed.'}
                      </p>
                    ) : (
                      <p className="text-white/60">
                        {imagePhaseLabel(turn.status)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        </aside>
      ) : null}
    </div>
  );
};

export default ImagePage;
