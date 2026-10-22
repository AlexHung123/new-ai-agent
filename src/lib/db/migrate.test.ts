import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const pgDir = path.join(process.cwd(), 'drizzle', 'pg');

function migrationName(file: string): string {
  return file.split('_')[0] || file;
}

function sqlFiles(): string[] {
  return readdirSync(pgDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

describe('postgres migrations', () => {
  it('uses unique numeric prefixes as ran_migrations keys', () => {
    const files = sqlFiles();
    const names = files.map(migrationName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('adds wcmsContentId after 0004 because 0004 already ran as ppt_decks', () => {
    const files = sqlFiles();
    const wcms = files.filter((file) =>
      readFileSync(path.join(pgDir, file), 'utf8').includes('"wcmsContentId"'),
    );
    expect(wcms.length).toBeGreaterThan(0);
    for (const file of wcms) {
      expect(Number(migrationName(file))).toBeGreaterThan(4);
    }
  });
});
