import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { stripHtml } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ChevronDown,
  CheckCircle2,
  XCircle,
  CircleDot,
  Wrench,
  X,
} from 'lucide-react';

type ToolState = 'RUNNING' | 'COMPLETED' | 'FAILED' | string;

type ToolExecution = {
  id?: string;
  name: string;
  state: ToolState;
  durationMs?: number;
  inputPreview?: unknown;
  resultPreview?: unknown;
};

const TOOL_LABELS: Record<string, string> = {
  load_survey_questions: 'Load survey',
  get_question_payload: 'Load question',
  cluster_survey_question: 'Cluster answers',
  process_survey_question: 'Save clusters',
  assemble_markdown_report: 'Build report',
  es_bm25_search: 'Search knowledge',
  guide_search: 'Search guide',
};

function parseMaybeJson(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return null;
    try {
      const parsed = JSON.parse(t);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function formatDuration(ms?: number): string | null {
  if (ms == null || Number.isNaN(Number(ms))) return null;
  const n = Number(ms);
  if (n < 1000) return `${Math.round(n)}ms`;
  if (n < 60_000) return `${(n / 1000).toFixed(1)}s`;
  return `${Math.floor(n / 60_000)}m ${Math.round((n % 60_000) / 1000)}s`;
}

function toolLabel(name: string): string {
  return TOOL_LABELS[name] || name.replace(/_/g, ' ');
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return stripHtml(v) || v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

/** One-line human summary — no raw JSON walls. */
function buildSummary(execution: ToolExecution): string {
  const input = parseMaybeJson(execution.inputPreview) || {};
  const result = parseMaybeJson(execution.resultPreview) || {};

  const parts: string[] = [];

  const index = input.index ?? result.index;
  const total = input.total ?? result.total;
  if (index != null && total != null) {
    parts.push(`${index}/${total}`);
  }

  const question =
    str(input.question) || str(result.question) || str(input.questionId) || str(result.questionId);
  if (question) {
    const q = question.length > 42 ? `${question.slice(0, 42)}…` : question;
    parts.push(q);
  }

  const itemCount = result.itemCount ?? input.itemCount;
  if (itemCount != null) parts.push(`${itemCount} answers`);

  const clusterCount = result.clusterCount;
  if (clusterCount != null) parts.push(`${clusterCount} clusters`);

  const surveyTotal = result.total ?? input.total;
  if (
    execution.name === 'load_survey_questions' &&
    surveyTotal != null &&
    index == null
  ) {
    parts.push(`${surveyTotal} questions`);
  }

  if (
    execution.name === 'assemble_markdown_report' &&
    result.processedCount != null &&
    result.totalCount != null
  ) {
    parts.push(`${result.processedCount}/${result.totalCount} processed`);
  }

  if (execution.state === 'FAILED') {
    const err = str(result.error) || str(result.note);
    if (err) parts.push(err.length > 48 ? `${err.slice(0, 48)}…` : err);
  }

  const query = str(input.query) || str(result.search_query);
  if (query && parts.length === 0) {
    parts.push(query.length > 48 ? `${query.slice(0, 48)}…` : query);
  }

  return parts.join(' · ');
}

function StatusBadge({
  state,
  durationMs,
}: {
  state: ToolState;
  durationMs?: number;
}) {
  const duration = formatDuration(durationMs);

  if (state === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {duration || 'Done'}
      </span>
    );
  }

  if (state === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-red-500">
        <XCircle className="w-3.5 h-3.5" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-sky-600 dark:text-sky-400">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      Running
    </span>
  );
}

function DetailPairs({ execution }: { execution: ToolExecution }) {
  const input = parseMaybeJson(execution.inputPreview) || {};
  const result = parseMaybeJson(execution.resultPreview) || {};

  const rows: Array<[string, string]> = [];
  const pick = (obj: Record<string, unknown>, keys: string[]) => {
    for (const k of keys) {
      const v = obj[k];
      if (v == null || v === '') continue;
      if (typeof v === 'object') continue;
      const text = typeof v === 'string' ? stripHtml(v) || v : String(v);
      rows.push([k, text]);
    }
  };

  pick(input, [
    'surveyId',
    'questionId',
    'question',
    'itemCount',
    'index',
    'total',
    'query',
  ]);
  pick(result, [
    'surveyId',
    'questionId',
    'clusterCount',
    'itemCount',
    'processedCount',
    'totalCount',
    'total',
    'error',
  ]);

  // de-dupe by key keeping first
  const seen = new Set<string>();
  const unique = rows.filter(([k]) => {
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (unique.length === 0) {
    return (
      <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
        No extra details
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
      {unique.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
            {k}
          </dt>
          <dd className="text-gray-700 dark:text-gray-200 break-all min-w-0">
            {v.length > 120 ? `${v.slice(0, 120)}…` : v}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

const ToolExecutionItem = ({
  execution,
  defaultExpanded = false,
}: {
  execution: ToolExecution;
  defaultExpanded?: boolean;
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isRunning = execution.state === 'RUNNING';
  const summary = buildSummary(execution);

  useEffect(() => {
    if (isRunning) setExpanded(false);
  }, [isRunning]);

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isRunning
          ? 'border-sky-300/60 dark:border-sky-500/40 bg-sky-50/60 dark:bg-sky-500/5'
          : execution.state === 'FAILED'
            ? 'border-red-200/80 dark:border-red-500/30 bg-red-50/40 dark:bg-red-500/5'
            : 'border-transparent bg-black/[0.02] dark:bg-white/[0.03]'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-2 px-2.5 py-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] rounded-lg transition-colors"
      >
        <span className="mt-0.5 text-gray-400 dark:text-gray-500 shrink-0">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <CircleDot className="w-3.5 h-3.5 opacity-60" />
          )}
        </span>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 truncate">
              {toolLabel(execution.name)}
            </span>
            <StatusBadge state={execution.state} durationMs={execution.durationMs} />
          </div>
          {summary ? (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-snug">
              {summary}
            </p>
          ) : null}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2.5 pt-0 ml-5 border-t border-black/5 dark:border-white/5">
              <div className="pt-2">
                <DetailPairs execution={execution} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolExecutionPanel = () => {
  const { toolExecutions, loading, messageAppeared, progress } = useChat();
  const [showToolExecution, setShowToolExecution] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toolExecutions && toolExecutions.length > 0) {
      setShowToolExecution(true);
      setShowAllCompleted(false);
    }
  }, [toolExecutions]);

  useEffect(() => {
    if (!toolExecutions || toolExecutions.length === 0) {
      setShowToolExecution(false);
    }
  }, [toolExecutions]);

  const hasTools = Boolean(toolExecutions && toolExecutions.length > 0);
  // Only open the Tools panel when real tool events exist — never for plain chat.
  const shouldShowPanel = hasTools && showToolExecution;
  const isWaitingForToken = loading && !messageAppeared;

  const stats = useMemo(() => {
    const list = toolExecutions || [];
    return {
      total: list.length,
      running: list.filter((e) => e.state === 'RUNNING').length,
      failed: list.filter((e) => e.state === 'FAILED').length,
      done: list.filter((e) => e.state === 'COMPLETED').length,
    };
  }, [toolExecutions]);

  // Keep active + recent completed visible; collapse long completed history.
  const visibleExecutions = useMemo(() => {
    const list = (toolExecutions || []) as ToolExecution[];
    if (showAllCompleted || list.length <= 8) return list;

    const active = list.filter(
      (e) => e.state === 'RUNNING' || e.state === 'FAILED',
    );
    const completed = list.filter((e) => e.state === 'COMPLETED');
    // Always keep milestone tools + last few completed
    const milestones = completed.filter((e) =>
      ['load_survey_questions', 'assemble_markdown_report'].includes(e.name),
    );
    const recentCompleted = completed
      .filter((e) => !milestones.includes(e))
      .slice(-4);

    const picked = new Set(
      [...milestones, ...recentCompleted, ...active].map(
        (e) => e.id || `${e.name}-${e.state}`,
      ),
    );
    // Preserve original order
    return list.filter((e) => picked.has(e.id || `${e.name}-${e.state}`));
  }, [toolExecutions, showAllCompleted]);

  const hiddenCompletedCount = Math.max(
    0,
    stats.done -
      visibleExecutions.filter((e) => e.state === 'COMPLETED').length,
  );

  // Auto-scroll when new running tools appear
  useEffect(() => {
    if (!listRef.current) return;
    if (stats.running > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [stats.running, toolExecutions?.length]);

  if (!shouldShowPanel) return null;

  const progressLabel =
    progress && progress.total > 0
      ? stripHtml(
          progress.message ||
            (progress.current > 0
              ? `${progress.current}/${progress.total}`
              : '') ||
            '',
        ) || null
      : null;

  const progressPct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed right-5 top-24 z-30 hidden xl:block w-[300px] 2xl:w-[340px]"
      >
        <div className="bg-light-secondary/95 dark:bg-dark-secondary/95 backdrop-blur-md rounded-2xl border border-light-200 dark:border-dark-200 shadow-lg overflow-hidden flex flex-col max-h-[min(70vh,640px)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-light-200/80 dark:border-dark-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <Wrench className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
              <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                Tools
              </span>
              {stats.total > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 tabular-nums">
                  {stats.done}/{stats.total}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowToolExecution(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Hide tool panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact status / progress — only while tools are active or finishing */}
          {(isWaitingForToken || progressLabel || stats.running > 0) && (
            <div className="px-3.5 py-2 border-b border-light-200/60 dark:border-dark-200/60 space-y-1.5">
              {isWaitingForToken && (
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="text-[11px] font-medium truncate">
                    {stats.running > 0 ? 'Working…' : 'Finishing response…'}
                  </span>
                </div>
              )}
              {progressLabel && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-snug">
                  {progressLabel}
                </p>
              )}
              {progressPct != null && progress?.status !== 'completed' && (
                <div className="h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500/80 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tool list */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin min-h-0"
          >
            {hiddenCompletedCount > 0 && !showAllCompleted && (
              <button
                type="button"
                onClick={() => setShowAllCompleted(true)}
                className="w-full text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-1.5 px-2 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-center"
              >
                Show {hiddenCompletedCount} earlier completed
              </button>
            )}

            {visibleExecutions.map((execution, i) => (
              <ToolExecutionItem
                key={execution.id || `${execution.name}-${i}`}
                execution={execution}
              />
            ))}

            {showAllCompleted && stats.total > 8 && (
              <button
                type="button"
                onClick={() => setShowAllCompleted(false)}
                className="w-full text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-1.5 px-2 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-center"
              >
                Collapse completed
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ToolExecutionPanel;
