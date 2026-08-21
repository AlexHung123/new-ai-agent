import { Pool } from 'pg';
import { getAppDatabaseUrl } from './connection';
import { importSqliteIfNeeded } from './importSqlite';

async function main() {
  const pool = new Pool({ connectionString: getAppDatabaseUrl() });
  try {
    const result = await importSqliteIfNeeded(pool);
    console.log(result);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
