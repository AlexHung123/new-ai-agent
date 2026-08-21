import { afterEach, describe, expect, it } from 'vitest';
import { getAppDatabaseUrl } from './connection';

const originalPi = process.env.PI_SESSION_DATABASE_URL;
const originalDb = process.env.DATABASE_URL;

afterEach(() => {
  if (originalPi === undefined) delete process.env.PI_SESSION_DATABASE_URL;
  else process.env.PI_SESSION_DATABASE_URL = originalPi;
  if (originalDb === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDb;
});

describe('getAppDatabaseUrl', () => {
  it('prefers PI_SESSION_DATABASE_URL over DATABASE_URL', () => {
    process.env.PI_SESSION_DATABASE_URL = 'postgresql://pi/sessions';
    process.env.DATABASE_URL = 'postgresql://other/db';
    expect(getAppDatabaseUrl()).toBe('postgresql://pi/sessions');
  });
});
