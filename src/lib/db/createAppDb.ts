import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type AppDb = NodePgDatabase<typeof schema>;

export function createAppDb(getUrl: () => string): {
  getPool: () => Pool;
  db: AppDb;
} {
  let pool: Pool | undefined;
  let database: AppDb | undefined;

  const getPool = () => {
    if (!pool) {
      pool = new Pool({ connectionString: getUrl() });
    }
    return pool;
  };

  const getDatabase = () => {
    if (!database) {
      database = drizzle(getPool(), { schema });
    }
    return database;
  };

  const db = new Proxy({} as AppDb, {
    get(_target, prop) {
      return Reflect.get(getDatabase(), prop, getDatabase());
    },
  });

  return { getPool, db };
}
