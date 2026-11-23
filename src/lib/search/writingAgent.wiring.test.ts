import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]) {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('writing agent Dochub wiring', () => {
  it('registers Dochub tools and does not bind fs tools', () => {
    const ctx = readSrc('shared/agent/getSharedAgentContext.ts');
    expect(ctx).toMatch(/createDochubTools/);
    expect(ctx).toMatch(/'query', 'get', 'multi_get', 'tree', 'status'/);
    const agent = readSrc('writingAgent.ts');
    expect(agent).toMatch(/emptyResponseFallback: WRITING_AGENT_EMPTY_REPLY/);
    expect(agent).toMatch(/bindTurnDochubTools/);
    expect(agent).not.toMatch(/bindTurnFsTools/);
    const route = readFileSync(
      path.join(__dirname, '../../app/api/chat/route.ts'),
      'utf8',
    );
    expect(route).toMatch(/loadWritingTurnContext/);
    expect(route).not.toMatch(/ensureUserWritingWorkspace/);
    expect(ctx).toMatch(/SHARED_AGENT_CONTEXT_REV = 15/);
  });
});
