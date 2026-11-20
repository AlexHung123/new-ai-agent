import { describe, expect, it, vi } from 'vitest';
import { runWithWritingTurn } from '../runtime/writingTurnContext';
import { createDochubTools } from './dochubTools';

const tree = {
  type: 'dir' as const,
  name: '',
  path: '',
  children: [
    {
      type: 'dir' as const,
      name: 'contracts',
      path: 'contracts',
      children: [],
    },
  ],
};

const ctx = {
  userId: '1',
  pin: 'contracts/2024',
  mentionedDocuments: [] as const,
  tree,
};

describe('createDochubTools', () => {
  it('does not put user_id on any schema', () => {
    for (const tool of createDochubTools()) {
      const params = JSON.stringify(tool.parameters);
      expect(params).not.toMatch(/user_id/);
      expect(tool.name).toMatch(/^(query|get|multi_get|tree|status)$/);
    }
  });

  it('sends JWT user id and clamped path on query', async () => {
    const search = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [{ file: 'qmd://markdown/contracts/2024/plan.md', line: 12 }],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    const result = await runWithWritingTurn(ctx, () =>
      query.execute('id', {
        searches: [{ type: 'lex', query: 'plan' }],
        path: 'invoices',
        user_id: 'alice',
      }),
    );
    expect(search).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        query: 'plan',
        mode: 'search',
        path: 'contracts/2024',
      }),
    );
    const details = result.details as { results: Array<{ file: string }> };
    expect(details.results[0].file).toBe('contracts/2024/plan.md');
  });

  it('omits path when the turn is unpinned', async () => {
    const search = vi.fn(async () => ({
      user_id: '1',
      mode: 'query',
      query: 'hi',
      results: [],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    await runWithWritingTurn({ ...ctx, pin: null }, () =>
      query.execute('id', { query: 'hi' }),
    );
    const body = search.mock.calls[0][1] as { path?: string };
    expect(body.path).toBeUndefined();
  });

  it('returns No user bound outside a turn', async () => {
    const query = createDochubTools()[0];
    const result = await query.execute('id', { query: 'hi' });
    expect(result.details).toMatchObject({
      ok: false,
      error: 'No user bound',
    });
  });
});
