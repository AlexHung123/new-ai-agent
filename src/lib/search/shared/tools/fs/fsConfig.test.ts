import { afterEach, describe, expect, it } from 'vitest';
import { getAgentFsConfig, resolveAgentFsMaxReadLines } from './fsConfig';

describe('resolveAgentFsMaxReadLines', () => {
  it('defaults to 80 when env and config omit the key', () => {
    expect(resolveAgentFsMaxReadLines(undefined, undefined)).toBe(80);
  });

  it('uses config.json when env is unset', () => {
    expect(resolveAgentFsMaxReadLines(undefined, 0)).toBe(0);
    expect(resolveAgentFsMaxReadLines('', 120)).toBe(120);
  });

  it('prefers env over config.json', () => {
    expect(resolveAgentFsMaxReadLines('40', 0)).toBe(40);
  });

  it('keeps 0 as whole-file (no line cap)', () => {
    expect(resolveAgentFsMaxReadLines('0', 80)).toBe(0);
  });

  it('clamps to 0–400', () => {
    expect(resolveAgentFsMaxReadLines('999', undefined)).toBe(400);
    expect(resolveAgentFsMaxReadLines(undefined, -3)).toBe(0);
  });
});

describe('AGENT_FS_MAX_READ_LINES', () => {
  const prev = process.env.AGENT_FS_MAX_READ_LINES;

  afterEach(() => {
    if (prev === undefined) delete process.env.AGENT_FS_MAX_READ_LINES;
    else process.env.AGENT_FS_MAX_READ_LINES = prev;
  });

  it('keeps 0 as whole-file (no line cap)', () => {
    process.env.AGENT_FS_MAX_READ_LINES = '0';
    expect(getAgentFsConfig().maxReadLines).toBe(0);
  });

  it('lets env override config.json', () => {
    process.env.AGENT_FS_MAX_READ_LINES = '12';
    expect(getAgentFsConfig().maxReadLines).toBe(12);
  });
});
