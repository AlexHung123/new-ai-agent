'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Mic, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import Select from '@/components/ui/Select';
import {
  getAuthHeaders,
  getAuthToken,
  initializeAuthToken,
} from '@/lib/utils/auth';
import { DEFAULT_TTS_MODEL, TTS_MODELS } from '@/lib/voice/ttsModels';

const VOICE_PERMISSION = 'chatVoiceAgent:execute';

const VoicePage = () => {
  const searchParams = useSearchParams();
  const [tokenReady, setTokenReady] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [refAudio, setRefAudio] = useState<File | null>(null);
  const [refText, setRefText] = useState('');
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_TTS_MODEL);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);

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
            data.permissions.includes(VOICE_PERMISSION),
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
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const canGenerate =
    Boolean(refAudio) && input.trim().length > 0 && !generating;

  const handleGenerate = async () => {
    if (!refAudio || !canGenerate) return;

    setGenerating(true);
    setError(null);

    const form = new FormData();
    form.set('input', input.trim());
    form.set('model', model);
    if (refText.trim()) {
      form.set('ref_text', refText.trim());
    }
    form.set('ref_audio', refAudio);

    const token = getAuthToken();
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const response = await fetch(`/itms/ai/api/voice/speech`, {
        method: 'POST',
        headers,
        body: form,
      });

      if (!response.ok) {
        let message = `Generation failed (${response.status})`;
        try {
          const body = await response.json();
          if (typeof body.error === 'string' && body.error) {
            message = body.error;
          }
        } catch {
          // keep fallback
        }
        setError(message);
        return;
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = nextUrl;
      setAudioUrl(nextUrl);
    } catch {
      setError('Could not reach the voice service. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loadingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="text-black/60 dark:text-white/60">
            Loading Agent Voice...
          </p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-black/60 dark:text-white/60">
            Agent Voice is not available for your account.
          </p>
          <p className="mt-2 text-sm text-black/40 dark:text-white/40">
            Please contact your administrator for access.
          </p>
          <Link
            href="/agents"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <ArrowLeft size={16} />
            Back to agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] w-full pb-24 pt-6 md:pt-10">
      <div className="pointer-events-none fixed -left-40 -top-40 z-0 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[100px] dark:bg-blue-900/20" />
      <div className="pointer-events-none fixed -right-40 top-40 z-0 h-[500px] w-[500px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-900/20" />

      <div className="relative z-10 mx-auto max-w-5xl px-2 md:px-4">
        <Link
          href="/agents"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to agents
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/80"
          >
            <div className="relative h-64 w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
              <Image
                src="/itms/ai/agent-voice.png"
                alt="Agent Voice"
                fill
                sizes="288px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#24A0ED] dark:bg-blue-500/10 dark:text-blue-400">
                <Mic size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-black dark:text-white">
                  Agent Voice
                </h1>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Clone a reference voice and generate speech
                </p>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onSubmit={(event) => {
              event.preventDefault();
              void handleGenerate();
            }}
            className="flex flex-col gap-5 rounded-3xl border border-white/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/80"
          >
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-black dark:text-white">
                Model
              </span>
              <span className="text-xs text-black/50 dark:text-white/50">
                Choose the TTS checkpoint used for cloning.
              </span>
              <Select
                aria-label="TTS model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                options={TTS_MODELS.map((entry) => ({
                  value: entry.id,
                  label: entry.label,
                }))}
                className="rounded-2xl border-black/10 bg-white px-4 py-3 text-sm text-black dark:border-white/10 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-black dark:text-white">
                Reference audio
              </span>
              <span className="text-xs text-black/50 dark:text-white/50">
                Upload a short WAV (about 3–10 seconds) of the voice to clone.
              </span>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-gray-950">
                <span className="flex min-w-0 items-center gap-2 text-black/70 dark:text-white/70">
                  <Upload size={16} />
                  <span className="truncate">
                    {refAudio ? refAudio.name : 'Choose ref_audio file'}
                  </span>
                </span>
                <input
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
                  className="hidden"
                  onChange={(event) => {
                    setRefAudio(event.target.files?.[0] ?? null);
                    setError(null);
                  }}
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-black dark:text-white">
                Reference transcript{' '}
                <span className="font-normal text-black/45 dark:text-white/45">
                  (optional)
                </span>
              </span>
              <span className="text-xs text-black/50 dark:text-white/50">
                Exact wording spoken in the reference audio, if you have it.
              </span>
              <textarea
                value={refText}
                onChange={(event) => setRefText(event.target.value)}
                rows={4}
                className="resize-y rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none ring-[#24A0ED] focus:ring-2 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                placeholder="在2014年4月15日國家主席習近平首次提出了總體國家安全觀..."
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-black dark:text-white">
                Text to speak
              </span>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={4}
                className="resize-y rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none ring-[#24A0ED] focus:ring-2 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                placeholder="你好，歡迎使用粵語語音合成。"
              />
            </label>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canGenerate}
              className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600/40"
            >
              {generating ? 'Generating…' : 'Generate speech'}
            </button>

            {audioUrl ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
                <p className="text-sm font-semibold text-black dark:text-white">
                  Generated audio
                </p>
                <audio controls src={audioUrl} className="w-full" />
                <a
                  href={audioUrl}
                  download="speech.wav"
                  className="inline-flex items-center gap-2 self-start text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  <Download size={16} />
                  Download speech.wav
                </a>
              </div>
            ) : null}
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default VoicePage;
