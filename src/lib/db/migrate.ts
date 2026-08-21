import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { getAppDatabaseUrl } from './connection';
import { importSqliteIfNeeded } from './importSqlite';

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const migrationsFolder = path.join(DATA_DIR, 'drizzle', 'pg');

function sanitizeSql(content: string) {
  return content
    .split(/\r?\n/)
    .filter(
      (l) => !l.trim().startsWith('-->') && !l.includes('statement-breakpoint'),
    )
    .join('\n');
}

export async function runMigrations(): Promise<void> {
  const pool = new Pool({ connectionString: getAppDatabaseUrl() });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ran_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        run_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (!fs.existsSync(migrationsFolder)) {
      console.warn(`No postgres migrations folder at ${migrationsFolder}`);
      return;
    }

    const files = fs
      .readdirSync(migrationsFolder)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const migrationName = file.split('_')[0] || file;
      const already = await pool.query(
        'SELECT 1 FROM ran_migrations WHERE name = $1',
        [migrationName],
      );
      if (already.rowCount) {
        console.log(`Skipping already-applied migration: ${file}`);
        continue;
      }

      const content = sanitizeSql(
        fs.readFileSync(path.join(migrationsFolder, file), 'utf-8'),
      );
      await pool.query(content);
      await pool.query('INSERT INTO ran_migrations (name) VALUES ($1)', [
        migrationName,
      ]);
      console.log(`Applied migration: ${file}`);
    }

    const imported = await importSqliteIfNeeded(pool);
    if (imported.skipped) {
      console.log('SQLite import skipped (no data/db.sqlite)');
    } else {
      console.log(
        `SQLite import chats=${imported.chats} messages=${imported.messages} sfc=${imported.sfc}`,
      );
    }
  } finally {
    await pool.end();
  }
}

