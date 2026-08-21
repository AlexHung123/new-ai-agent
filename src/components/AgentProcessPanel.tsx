'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import {
  formatDuration,
  stepDurationMs,
  stepTitle,
  type AgentProcessState,
} from '@/lib/chat/agentProcess';

type Props = {
  process: AgentProcessState;
};

export default function AgentProcessPanel({ process }: Props) {
  const running = process.status === 'running';
  const [expanded, setExpanded] = useState(running);
  const [now, setNow] = useState(Date.now());
  const [openStepIds, setOpenStepIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!running) return;
    setExpanded(true);
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [running]);

  const stepCount = process.steps.length;
  const toolCount = process.steps.filter((s) => s.kind === 'tool').length;
  const sourceCount = process.sourceCount ?? 0;
  const hasError = process.steps.some((s) => s.status === 'error');
  const totalMs = Math.max(
    0,
    (running
      ? now
      : process.steps.reduce(
          (end, s) => Math.max(end, s.endedAt ?? 0),
          process.startedAt,
        )) - process.startedAt,
  );
  const timePart = formatDuration(totalMs);

  let summary: string;
  if (running) {
    summary =
      toolCount > 0
        ? `Running · ${toolCount} tool${toolCount === 1 ? '' : 's'} · ${timePart}`
        : stepCount <= 1
          ? `Agent working… ${timePart}`
          : `Running · ${stepCount} step${stepCount === 1 ? '' : 's'} · ${timePart}`;
  } else {
    const parts = [
      'Process details',
      `${stepCount} step${stepCount === 1 ? '' : 's'}`,
    ];
    if (toolCount > 0) {
      parts.push(`${toolCount} tool${toolCount === 1 ? '' : 's'}`);
    }
    parts.push(timePart);
    if (sourceCount > 0) {
      parts.push(`${sourceCount} source${sourceCount === 1 ? '' : 's'}`);
    }
    if (hasError) parts.push('warnings');
    summary = parts.join(' · ');
  }

  return (
    <div className="mb-2.5">
      <button
        type="button"
        className="flex items-center gap-2 min-h-6 py-0.5 text-left text-xs font-medium text-black/50 dark:text-white/50 hover:text-black/70 dark:hover:text-white/70"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={expanded ? 'Collapse process' : 'Expand process'}
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="inline-flex min-w-0 items-center gap-2">
          {running && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-500" />
          )}
          <span className="truncate">{summary}</span>
        </span>
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-1.5">
          {process.steps.map((step) => {
            const isTool = step.kind === 'tool';
            const stepOpen = Boolean(openStepIds[step.id]);
            const ms = stepDurationMs(step, now);
            const isError = step.status === 'error';
            const detail =
              isTool && step.detail && step.status !== 'running'
                ? step.detail
                : null;

            if (isTool) {
              return (
                <div
                  key={step.id}
                  className={`overflow-hidden rounded-md border text-xs ${
                    isError
                      ? 'border-red-300/70 bg-red-50/50 dark:border-red-500/40 dark:bg-red-500/10'
                      : step.status === 'running'
                        ? 'border-sky-300/70 bg-sky-50/50 dark:border-sky-500/40 dark:bg-sky-500/10'
                        : 'border-emerald-300/70 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-center gap-1.5 px-2.5 py-1.5 text-left"
                    onClick={() =>
                      setOpenStepIds((prev) => ({
                        ...prev,
                        [step.id]: !prev[step.id],
                      }))
                    }
                    aria-expanded={stepOpen}
                  >
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-semibold ${
                        isError
                          ? 'text-red-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {step.status === 'running' ? (
                        <Loader2 className="h-3 w-3 animate-spin text-sky-500" />
                      ) : null}
                      {step.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-black/40 dark:text-white/40">
                      {step.status === 'running'
                        ? 'running…'
                        : detail || (isError ? 'failed' : 'done')}
                    </span>
                    <span className="shrink-0 tabular-nums text-[11px] text-black/40 dark:text-white/40">
                      {formatDuration(ms)}
                    </span>
                    <ChevronDown
                      className={`h-2.5 w-2.5 shrink-0 text-black/40 transition-transform dark:text-white/40 ${
                        stepOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {stepOpen && detail && (
                    <pre className="m-0 overflow-auto whitespace-pre-wrap break-words border-t border-black/5 px-2.5 py-2 text-xs text-black/70 dark:border-white/10 dark:text-white/70">
                      {detail}
                    </pre>
                  )}
                </div>
              );
            }

            if (step.kind === 'thinking' || step.kind === 'writing') {
              return (
                <div
                  key={step.id}
                  className="inline-flex max-w-full items-center gap-2 rounded-lg bg-black/[0.04] px-3.5 py-1.5 text-[13px] text-black/70 dark:bg-white/[0.06] dark:text-white/70"
                >
                  {step.status === 'running' && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                  )}
                  <span className="min-w-0 break-words">
                    {stepTitle(step, now)}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={step.id}
                className={`py-0.5 text-xs leading-snug ${
                  step.status === 'error'
                    ? 'text-red-500'
                    : 'text-black/45 dark:text-white/45'
                }`}
              >
                {stepTitle(step, now)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
