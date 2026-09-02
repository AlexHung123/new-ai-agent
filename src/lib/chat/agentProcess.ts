export type AgentStepStatus = 'running' | 'done' | 'error' | 'info';

export type AgentProcessStep = {
  id: string;
  kind: 'thinking' | 'tool' | 'writing' | 'status';
  label: string;
  detail?: string;
  status: AgentStepStatus;
  startedAt: number;
  endedAt?: number;
  toolCallId?: string;
};

export type AgentProcessState = {
  messageId: string;
  steps: AgentProcessStep[];
  status: 'running' | 'done';
  startedAt: number;
  sourceCount?: number;
};

const TOOL_LABELS: Record<string, string> = {
  load_survey_questions: 'Load survey',
  get_question_payload: 'Load question',
  cluster_survey_question: 'Cluster answers',
  process_survey_question: 'Save clusters',
  assemble_markdown_report: 'Build report',
  es_bm25_search: 'Search knowledge',
  guide_search: 'Search guide',
  read_skill: 'Read skill',
  ask_user: 'Ask questions',
  commit_brief: 'Save brief',
  commit_outline: 'Save outline',
  patch_outline: 'Update outline',
  commit_page_plan: 'Plan a page',
  get_page_plan: 'Read page plan',
  get_deck: 'Read deck',
  set_theme: 'Set theme',
  advance_stage: 'Advance stage',
  export_deck: 'Export deck',
};

export function friendlyToolName(name: string): string {
  const key = (name || '').trim();
  if (TOOL_LABELS[key]) return TOOL_LABELS[key];
  return key.replace(/_/g, ' ') || 'tool';
}

let stepSeq = 0;

function uniqueStepId(...parts: Array<string | undefined>): string {
  stepSeq += 1;
  return [...parts.filter((part) => part && part.length > 0), Date.now(), String(stepSeq)].join(
    '-',
  );
}

export function createInitialProcess(messageId: string): AgentProcessState {
  const now = Date.now();
  return {
    messageId,
    status: 'running',
    startedAt: now,
    steps: [
      {
        id: uniqueStepId('thinking'),
        kind: 'thinking',
        label: 'Thinking',
        status: 'running',
        startedAt: now,
      },
    ],
  };
}

export function applyToolStart(
  prev: AgentProcessState | null,
  toolName: string,
  toolCallId?: string,
): AgentProcessState | null {
  if (!prev || prev.status === 'done') return prev;
  const now = Date.now();
  const name = friendlyToolName(toolName);
  const callId = toolCallId?.trim() || undefined;
  const closed = prev.steps.map((s) =>
    s.status === 'running' && s.kind === 'thinking'
      ? { ...s, status: 'done' as const, endedAt: now }
      : s,
  );
  return {
    ...prev,
    steps: [
      ...closed,
      {
        id: uniqueStepId('tool', callId ?? toolName),
        kind: 'tool',
        label: name,
        detail: toolName,
        status: 'running',
        startedAt: now,
        ...(callId ? { toolCallId: callId } : {}),
      },
    ],
  };
}

export function applyToolEnd(
  prev: AgentProcessState | null,
  toolName: string,
  ok: boolean,
  summary?: string,
  toolCallId?: string,
): AgentProcessState | null {
  if (!prev || prev.status === 'done') return prev;
  const now = Date.now();
  const friendly = friendlyToolName(toolName);
  const callId = toolCallId?.trim() || undefined;
  const detailText =
    typeof summary === 'string' && summary.trim() ? summary.trim() : undefined;
  const nextStatus: AgentStepStatus = ok ? 'done' : 'error';

  const matchesRunningTool = (s: AgentProcessStep): boolean => {
    if (s.kind !== 'tool' || s.status !== 'running') return false;
    if (callId) return s.toolCallId === callId;
    return s.detail === toolName || s.label === friendly;
  };

  let matched = false;
  const steps = [...prev.steps].reverse().map((s) => {
    if (matched || !matchesRunningTool(s)) return s;
    matched = true;
    return {
      ...s,
      status: nextStatus,
      endedAt: now,
      detail: detailText,
    };
  });
  steps.reverse();
  if (!matched) {
    let closed = false;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].kind === 'tool' && steps[i].status === 'running') {
        steps[i] = {
          ...steps[i],
          status: nextStatus,
          endedAt: now,
          detail: detailText,
        };
        closed = true;
        break;
      }
    }
    if (!closed) {
      steps.push({
        id: uniqueStepId('tool', callId ?? toolName, 'end'),
        kind: 'tool',
        label: friendly,
        detail: detailText,
        status: nextStatus,
        startedAt: now,
        endedAt: now,
        ...(callId ? { toolCallId: callId } : {}),
      });
    }
  }
  return { ...prev, steps };
}

export function applyTextStarted(
  prev: AgentProcessState | null,
): AgentProcessState | null {
  if (!prev || prev.status === 'done') return prev;
  if (prev.steps.some((s) => s.kind === 'writing')) return prev;
  const now = Date.now();
  const steps = prev.steps.map((s) =>
    s.status === 'running' ? { ...s, status: 'done' as const, endedAt: now } : s,
  );
  return {
    ...prev,
    steps: [
      ...steps,
      {
        id: uniqueStepId('writing'),
        kind: 'writing',
        label: 'Writing answer',
        status: 'running',
        startedAt: now,
      },
    ],
  };
}

export function applyProgressMessage(
  prev: AgentProcessState | null,
  message: string,
): AgentProcessState | null {
  if (!prev || prev.status === 'done') return prev;
  const text = message.trim();
  if (!text) return prev;
  const now = Date.now();
  const existing = prev.steps.findIndex(
    (s) => s.kind === 'status' && s.detail === 'progress',
  );
  if (existing >= 0) {
    const steps = [...prev.steps];
    steps[existing] = {
      ...steps[existing],
      label: text,
      startedAt: steps[existing].startedAt,
      endedAt: now,
    };
    return { ...prev, steps };
  }
  return {
    ...prev,
    steps: [
      ...prev.steps,
      {
        id: uniqueStepId('status-progress'),
        kind: 'status',
        label: text,
        detail: 'progress',
        status: 'info',
        startedAt: now,
        endedAt: now,
      },
    ],
  };
}

export function applyProcessDone(
  prev: AgentProcessState | null,
  opts?: { sourceCount?: number },
): AgentProcessState | null {
  if (!prev) return prev;
  const now = Date.now();
  return {
    ...prev,
    status: 'done',
    ...(typeof opts?.sourceCount === 'number'
      ? { sourceCount: opts.sourceCount }
      : {}),
    steps: prev.steps.map((s) =>
      s.status === 'running'
        ? { ...s, status: 'done' as const, endedAt: now }
        : s,
    ),
  };
}

export function stepDurationMs(step: AgentProcessStep, now: number): number {
  return (step.endedAt ?? now) - step.startedAt;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  if (ms < 1000) {
    const tenths = Math.max(0.1, Math.round(ms / 100) / 10);
    return tenths < 1 ? `${tenths.toFixed(1)}s` : '1s';
  }
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatDurationLong(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const sec = Math.max(1, Math.round(ms / 1000));
  return sec === 1 ? '1 second' : `${sec} seconds`;
}

export function stepTitle(step: AgentProcessStep, now: number): string {
  const ms = stepDurationMs(step, now);
  if (step.kind === 'thinking') {
    if (step.status === 'running') return `Thinking… ${formatDuration(ms)}`;
    return `Thought for ${formatDurationLong(ms)}`;
  }
  if (step.kind === 'writing') {
    if (step.status === 'running') return `Writing answer… ${formatDuration(ms)}`;
    return `Wrote answer · ${formatDuration(ms)}`;
  }
  if (step.kind === 'status') {
    return step.label;
  }
  if (step.status === 'running') return `${step.label}… ${formatDuration(ms)}`;
  if (step.status === 'error')
    return `${step.label} (failed) · ${formatDuration(ms)}`;
  return `${step.label} · ${formatDuration(ms)}`;
}
