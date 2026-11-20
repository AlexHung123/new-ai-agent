import { describe, expect, it } from 'vitest';
import { ingestBadge } from './taskStatus';

describe('ingestBadge', () => {
  it('maps pending update, embed, success, and failure', () => {
    expect(
      ingestBadge({ status: 'pending', stage: 'qmd_update' }),
    ).toBe('indexing');
    expect(
      ingestBadge({ status: 'pending', stage: 'qmd_embed' }),
    ).toBe('embedding');
    expect(
      ingestBadge({ status: 'succeeded', stage: 'qmd_embed' }),
    ).toBeNull();
    expect(
      ingestBadge({ status: 'failed', stage: 'qmd_update', last_error: 'boom' }),
    ).toBe('failed');
    expect(ingestBadge(null)).toBeNull();
  });
});
