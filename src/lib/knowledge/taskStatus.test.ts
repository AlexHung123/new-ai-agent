import { describe, expect, it } from 'vitest';
import { ingestBadge, parseLabel } from './taskStatus';

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
    expect(ingestBadge({ status: 'timed_out' })).toBeNull();
  });

  it('maps ingest state to a Parse column label', () => {
    expect(parseLabel({ status: 'pending', stage: 'qmd_update' })).toBe(
      'Indexing',
    );
    expect(parseLabel({ status: 'pending', stage: 'qmd_embed' })).toBe(
      'Embedding',
    );
    expect(parseLabel({ status: 'failed', stage: 'qmd_update' })).toBe('Failed');
    expect(parseLabel({ status: 'succeeded', stage: 'qmd_embed' })).toBe('done');
    expect(parseLabel(null)).toBe('done');
  });
});
