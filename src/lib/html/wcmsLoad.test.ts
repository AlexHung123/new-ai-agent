import { describe, expect, it } from 'vitest';
import { shouldApplyFetchedWcmsHtml } from './wcmsLoad';

describe('shouldApplyFetchedWcmsHtml', () => {
  it('applies the response that belongs to the current request', () => {
    expect(
      shouldApplyFetchedWcmsHtml({
        requestGeneration: 2,
        activeGeneration: 2,
        editedSinceRequest: false,
      }),
    ).toBe(true);
  });

  it('drops a response after the canvas was edited or a newer request started', () => {
    expect(
      shouldApplyFetchedWcmsHtml({
        requestGeneration: 1,
        activeGeneration: 2,
        editedSinceRequest: false,
      }),
    ).toBe(false);
    expect(
      shouldApplyFetchedWcmsHtml({
        requestGeneration: 2,
        activeGeneration: 2,
        editedSinceRequest: true,
      }),
    ).toBe(false);
  });
});
