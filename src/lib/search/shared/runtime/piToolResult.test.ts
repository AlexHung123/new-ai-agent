import { describe, expect, it } from 'vitest';
import { jsonToolResult } from './piToolResult';

describe('jsonToolResult', () => {
  it('puts JSON text in content and keeps the structured value in details', () => {
    const value = { total: 1, chunks: [{ content: 'hit' }] };
    const result = jsonToolResult(value);

    expect(result.content).toEqual([
      { type: 'text', text: JSON.stringify(value) },
    ]);
    expect(result.details).toEqual(value);
    expect(result.details.total).toBe(1);
  });
});
