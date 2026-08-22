import { afterEach, describe, expect, it } from 'vitest';
import { getAgentFsConfig } from './fsConfig';

describe('AGENT_FS_MAX_READ_LINES', () => {
  const prev = process.env.AGENT_FS_MAX_READ_LINES;

  afterEach(() => {
    if (prev === undefined) delete process.env.AGENT_FS_MAX_READ_LINES;
    else process.env.AGENT_FS_MAX_READ_LINES = prev;
  });

  it('defaults to 80', () => {
    delete process.env.AGENT_FS_MAX_READ_LINES;
    expect(getAgentFsConfig().maxReadLines).toBe(80);
  });

  it('keeps 0 as whole-file (no line cap)', () => {
    process.env.AGENT_FS_MAX_READ_LINES = '0';
    expect(getAgentFsConfig().maxReadLines).toBe(0);
  });
});
