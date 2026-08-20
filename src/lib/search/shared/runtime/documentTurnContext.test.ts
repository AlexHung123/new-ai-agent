import { describe, expect, it } from 'vitest';
import {
  getDocumentTurnContext,
  runWithDocumentTurn,
} from './documentTurnContext';

describe('documentTurnContext', () => {
  it('returns undefined outside a turn', () => {
    expect(getDocumentTurnContext()).toBeUndefined();
  });

  it('exposes the bound document inside runWithDocumentTurn', async () => {
    const ctx = { id: 'spr', title: 'SPR', rootAbs: '/tmp/spr' };
    const seen = await runWithDocumentTurn(ctx, async () =>
      getDocumentTurnContext(),
    );
    expect(seen).toEqual(ctx);
    expect(getDocumentTurnContext()).toBeUndefined();
  });

  it('does not leak nested inner root to the outer turn', async () => {
    const outer = { id: 'spr', title: 'SPR', rootAbs: '/tmp/spr' };
    const inner = { id: 'csr', title: 'Full CSR', rootAbs: '/tmp/csr' };
    const roots: string[] = [];
    await runWithDocumentTurn(outer, async () => {
      roots.push(getDocumentTurnContext()!.rootAbs);
      await runWithDocumentTurn(inner, async () => {
        roots.push(getDocumentTurnContext()!.rootAbs);
      });
      roots.push(getDocumentTurnContext()!.rootAbs);
    });
    expect(roots).toEqual(['/tmp/spr', '/tmp/csr', '/tmp/spr']);
  });
});
