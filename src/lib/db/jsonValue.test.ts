import { describe, expect, it } from 'vitest';
import { parseSqliteJsonValue } from './jsonValue';

describe('parseSqliteJsonValue', () => {
  it('parses a JSON string', () => {
    expect(parseSqliteJsonValue('[{"name":"a"}]', [])).toEqual([{ name: 'a' }]);
  });

  it('returns objects as-is', () => {
    expect(parseSqliteJsonValue({ keep: true }, {})).toEqual({ keep: true });
  });

  it('returns the fallback for empty or invalid values', () => {
    expect(parseSqliteJsonValue(null, [])).toEqual([]);
    expect(parseSqliteJsonValue('not-json', [])).toEqual([]);
  });
});
