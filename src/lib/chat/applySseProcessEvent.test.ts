import { describe, expect, it } from 'vitest';
import { createInitialProcess } from './agentProcess';
import { applySseProcessEvent } from './applySseProcessEvent';

describe('applySseProcessEvent', () => {
  it('starts a tool from tool_execution RUNNING', () => {
    const next = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'tool_execution',
      data: { id: 't1', name: 'es_bm25_search', state: 'RUNNING' },
    });
    expect(next?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      status: 'running',
      detail: 'es_bm25_search',
    });
  });

  it('completes a tool from tool_execution COMPLETED', () => {
    const running = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'tool_execution',
      data: { id: 't1', name: 'es_bm25_search', state: 'RUNNING' },
    });
    const next = applySseProcessEvent(running, {
      type: 'tool_execution',
      data: {
        id: 't1',
        name: 'es_bm25_search',
        state: 'COMPLETED',
        resultPreview: { total: 3 },
      },
    });
    expect(next?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      status: 'done',
    });
  });

  it('shows the file path when fs_read completes', () => {
    const running = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'tool_execution',
      data: { id: 't2', name: 'fs_read', state: 'RUNNING' },
    });
    const next = applySseProcessEvent(running, {
      type: 'tool_execution',
      data: {
        id: 't2',
        name: 'fs_read',
        state: 'COMPLETED',
        resultPreview: { ok: true, rel: 'wiki/SCHEMA.md' },
      },
    });
    expect(next?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      label: 'fs read',
      status: 'done',
      detail: 'Read wiki/SCHEMA.md',
    });
  });

  it('shows grep match count and query when fs_grep completes', () => {
    const running = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'tool_execution',
      data: { id: 't3', name: 'fs_grep', state: 'RUNNING' },
    });
    const next = applySseProcessEvent(running, {
      type: 'tool_execution',
      data: {
        id: 't3',
        name: 'fs_grep',
        state: 'COMPLETED',
        resultPreview: { hitCount: 3, query: '轉職' },
      },
    });
    expect(next?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      label: 'fs grep',
      status: 'done',
      detail: '3 matches · 轉職',
    });
  });

  it('prefers the server-provided summary string', () => {
    const running = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'tool_execution',
      data: { id: 't4', name: 'fs_read', state: 'RUNNING' },
    });
    const next = applySseProcessEvent(running, {
      type: 'tool_execution',
      data: {
        id: 't4',
        name: 'fs_read',
        state: 'COMPLETED',
        summary: 'Read wiki/log.md',
        resultPreview: { ok: true, rel: 'wiki/SCHEMA.md' },
      },
    });
    expect(next?.steps.at(-1)?.detail).toBe('Read wiki/log.md');
  });

  it('fails a tool from tool_error', () => {
    const running = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'tool_execution',
      data: { id: 't1', name: 'guide_search', state: 'RUNNING' },
    });
    const next = applySseProcessEvent(running, {
      type: 'tool_error',
      data: { id: 't1', name: 'guide_search', error: 'boom' },
    });
    expect(next?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      status: 'error',
      detail: 'boom',
    });
  });

  it('maps progress messages and ignores finished status', () => {
    const withProgress = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'progress',
      data: { status: 'processing', message: 'Clustering 1/4', current: 1, total: 4 },
    });
    expect(withProgress?.steps.some((s) => s.label === 'Clustering 1/4')).toBe(
      true,
    );

    const afterFinish = applySseProcessEvent(withProgress, {
      type: 'progress',
      data: { status: 'finished', message: 'done' },
    });
    expect(afterFinish).toBe(withProgress);
  });

  it('starts writing on the first message event', () => {
    const next = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'message',
      data: 'Hello',
    });
    expect(next?.steps.some((s) => s.kind === 'writing')).toBe(true);
  });

  it('marks the process done on messageEnd', () => {
    const next = applySseProcessEvent(createInitialProcess('msg-1'), {
      type: 'messageEnd',
    });
    expect(next?.status).toBe('done');
  });
});
