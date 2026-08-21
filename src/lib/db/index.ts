import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { getAppDatabaseUrl } from './connection';

declare global {
  // eslint-disable-next-line no-var
  var __appPgPool: Pool | undefined;
}

const pool =
  global.__appPgPool ??
  new Pool({
    connectionString: getAppDatabaseUrl(),
  });

if (process.env.NODE_ENV !== 'production') {
  global.__appPgPool = pool;
}

const db = drizzle(pool, { schema });

export { pool };
export default db;
