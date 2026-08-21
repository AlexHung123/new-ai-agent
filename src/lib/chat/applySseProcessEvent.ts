import {
  applyProcessDone,
  applyProgressMessage,
  applyTextStarted,
  applyToolEnd,
  applyToolStart,
  type AgentProcessState,
} from './agentProcess';
import { buildToolEndSummary } from './toolSummary';

export type ChatSseEvent = {
  type: string;
  data?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toolSummary(
  toolName: string,
  data: Record<string, unknown>,
  isError: boolean,
): string | undefined {
  if (typeof data.summary === 'string' && data.summary.trim()) {
    return data.summary.trim();
  }
  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  const preview = data.resultPreview;
  if (typeof preview === 'string' && preview.trim()) {
    return preview.length > 160 ? `${preview.slice(0, 159)}…` : preview;
  }
  const { summary } = buildToolEndSummary(
    toolName,
    preview ?? data,
    isError,
  );
  return summary;
}

function progressText(data: Record<string, unknown>): string {
  const raw =
    (typeof data.message === 'string' && data.message) ||
    (typeof data.question === 'string' && data.question) ||
    '';
  return raw.replace(/<[^>]+>/g, '').trim();
}

export function applySseProcessEvent(
  prev: AgentProcessState | null,
  event: ChatSseEvent,
): AgentProcessState | null {
  if (!prev) return prev;
  const data = asRecord(event.data) ?? {};

  if (event.type === 'tool_execution') {
    const name = typeof data.name === 'string' ? data.name : 'tool';
    const state = typeof data.state === 'string' ? data.state : '';
    if (state === 'RUNNING') return applyToolStart(prev, name);
    if (state === 'COMPLETED') {
      return applyToolEnd(prev, name, true, toolSummary(name, data, false));
    }
    if (state === 'FAILED') {
      return applyToolEnd(prev, name, false, toolSummary(name, data, true));
    }
    return prev;
  }

  if (event.type === 'tool_error') {
    const name = typeof data.name === 'string' ? data.name : 'tool';
    return applyToolEnd(prev, name, false, toolSummary(name, data, true));
  }

  if (event.type === 'progress') {
    const status = typeof data.status === 'string' ? data.status : '';
    if (status === 'finished' || status === 'completed') return prev;
    const text = progressText(data);
    if (!text) return prev;
    return applyProgressMessage(prev, text);
  }

  if (event.type === 'message') {
    return applyTextStarted(prev);
  }

  if (event.type === 'messageEnd' || event.type === 'monitor_error') {
    return applyProcessDone(prev);
  }

  return prev;
}
