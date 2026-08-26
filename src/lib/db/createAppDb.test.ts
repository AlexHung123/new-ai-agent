import { describe, expect, it } from 'vitest';
import { createAppDb } from './createAppDb';

describe('createAppDb', () => {
  it('does not read the connection string until the db is used', () => {
    let calls = 0;
    createAppDb(() => {
      calls += 1;
      return 'postgresql://127.0.0.1:1/next-build';
    });
    expect(calls).toBe(0);
  });

  it('reads the connection string once on first pool access', async () => {
    let calls = 0;
    const { getPool } = createAppDb(() => {
      calls += 1;
      return 'postgresql://127.0.0.1:1/next-build';
    });

    const pool = getPool();
    expect(calls).toBe(1);
    expect(getPool()).toBe(pool);
    expect(calls).toBe(1);
    await pool.end();
  });
});
