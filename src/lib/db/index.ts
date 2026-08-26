import { Pool } from 'pg';
import { getAppDatabaseUrl } from './connection';
import { createAppDb } from './createAppDb';

declare global {
  // eslint-disable-next-line no-var
  var __appDbResources: ReturnType<typeof createAppDb> | undefined;
}

const resources =
  (process.env.NODE_ENV !== 'production' && global.__appDbResources) ||
  createAppDb(getAppDatabaseUrl);

if (process.env.NODE_ENV !== 'production') {
  global.__appDbResources = resources;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = resources.getPool();
    return Reflect.get(real, prop, real);
  },
});

export default resources.db;
