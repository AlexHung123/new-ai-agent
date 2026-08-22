import { describe, expect, it } from 'vitest';
import {
  applyProcessDone,
  applyProgressMessage,
  applyTextStarted,
  applyToolEnd,
  applyToolStart,
  createInitialProcess,
  friendlyToolName,
} from './agentProcess';

describe('createInitialProcess', () => {
  it('starts a running thinking step', () => {
    const process = createInitialProcess('msg-1');
    expect(process.messageId).toBe('msg-1');
    expect(process.status).toBe('running');
    expect(process.steps).toHaveLength(1);
    expect(process.steps[0]).toMatchObject({
      kind: 'thinking',
      status: 'running',
    });
  });
});

describe('friendlyToolName', () => {
  it('uses known labels for this app tools', () => {
    expect(friendlyToolName('es_bm25_search')).toBe('Search knowledge');
    expect(friendlyToolName('guide_search')).toBe('Search guide');
    expect(friendlyToolName('load_survey_questions')).toBe('Load survey');
  });

  it('uses Read skill for the skill loader', () => {
    expect(friendlyToolName('read_skill')).toBe('Read skill');
  });

  it('falls back to spaced tool names', () => {
    expect(friendlyToolName('fs_read')).toBe('fs read');
    expect(friendlyToolName('fs_grep')).toBe('fs grep');
  });
});

describe('applyToolStart', () => {
  it('closes thinking and adds a running tool step', () => {
    const started = applyToolStart(
      createInitialProcess('msg-1'),
      'es_bm25_search',
    );
    expect(started?.steps[0]).toMatchObject({
      kind: 'thinking',
      status: 'done',
    });
    expect(started?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      label: 'Search knowledge',
      detail: 'es_bm25_search',
      status: 'running',
    });
  });

  it('gives unique ids when the same tool starts twice in the same millisecond', () => {
    const first = applyToolStart(createInitialProcess('msg-1'), 'fs_read');
    const second = applyToolStart(first, 'fs_read');
    const toolIds = (second?.steps ?? [])
      .filter((s) => s.kind === 'tool')
      .map((s) => s.id);
    expect(toolIds).toHaveLength(2);
    expect(new Set(toolIds).size).toBe(2);
  });

  it('keeps a previous running tool open when another starts', () => {
    const first = applyToolStart(
      createInitialProcess('msg-1'),
      'fs_read',
      'call-a',
    );
    const second = applyToolStart(first, 'fs_read', 'call-b');
    const tools = (second?.steps ?? []).filter((s) => s.kind === 'tool');
    expect(tools).toHaveLength(2);
    expect(tools.every((s) => s.status === 'running')).toBe(true);
    expect(tools.map((s) => s.toolCallId)).toEqual(['call-a', 'call-b']);
  });
});

describe('applyToolEnd', () => {
  it('marks the matching running tool as done', () => {
    const running = applyToolStart(
      createInitialProcess('msg-1'),
      'guide_search',
    );
    const ended = applyToolEnd(running, 'guide_search', true, '12 chunks');
    expect(ended?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      status: 'done',
      detail: '12 chunks',
    });
  });

  it('marks the matching running tool as error', () => {
    const running = applyToolStart(
      createInitialProcess('msg-1'),
      'guide_search',
    );
    const ended = applyToolEnd(running, 'guide_search', false, 'timeout');
    expect(ended?.steps.at(-1)).toMatchObject({
      kind: 'tool',
      status: 'error',
      detail: 'timeout',
    });
  });

  it('ends only the matching parallel tool call', () => {
    const first = applyToolStart(
      createInitialProcess('msg-1'),
      'fs_read',
      'call-a',
    );
    const second = applyToolStart(first, 'fs_read', 'call-b');
    const ended = applyToolEnd(
      second,
      'fs_read',
      true,
      'Read a.md',
      'call-a',
    );
    const tools = (ended?.steps ?? []).filter((s) => s.kind === 'tool');
    expect(tools).toHaveLength(2);
    expect(tools.find((s) => s.toolCallId === 'call-a')).toMatchObject({
      status: 'done',
      detail: 'Read a.md',
    });
    expect(tools.find((s) => s.toolCallId === 'call-b')).toMatchObject({
      status: 'running',
    });
  });
});

describe('applyTextStarted', () => {
  it('adds a writing step once', () => {
    const once = applyTextStarted(createInitialProcess('msg-1'));
    const twice = applyTextStarted(once);
    expect(once?.steps.filter((s) => s.kind === 'writing')).toHaveLength(1);
    expect(twice?.steps.filter((s) => s.kind === 'writing')).toHaveLength(1);
    expect(once?.steps[0].status).toBe('done');
  });
});

describe('applyProgressMessage', () => {
  it('updates a single progress status step in place', () => {
    const first = applyProgressMessage(
      createInitialProcess('msg-1'),
      'Processing 1/3',
    );
    const second = applyProgressMessage(first, 'Processing 2/3');
    const statusSteps = second?.steps.filter((s) => s.kind === 'status');
    expect(statusSteps).toHaveLength(1);
    expect(statusSteps?.[0]).toMatchObject({
      label: 'Processing 2/3',
      status: 'info',
    });
  });
});

describe('applyProcessDone', () => {
  it('closes running steps and records source count', () => {
    const done = applyProcessDone(createInitialProcess('msg-1'), {
      sourceCount: 4,
    });
    expect(done?.status).toBe('done');
    expect(done?.sourceCount).toBe(4);
    expect(done?.steps.every((s) => s.status !== 'running')).toBe(true);
  });
});
