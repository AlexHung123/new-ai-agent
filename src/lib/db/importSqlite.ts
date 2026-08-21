import fs from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { parseSqliteJsonValue } from './jsonValue';

export type ImportSqliteResult = {
  skipped: boolean;
  chats: number;
  messages: number;
  sfc: number;
};

const DATA_DIR = process.env.DATA_DIR || process.cwd();

function sqlitePath(): string {
  return path.join(DATA_DIR, './data/db.sqlite');
}

export async function importSqliteIfNeeded(
  pool: Pool,
  options?: { sqliteFile?: string },
): Promise<ImportSqliteResult> {
  const file = options?.sqliteFile ?? sqlitePath();
  if (!fs.existsSync(file)) {
    return { skipped: true, chats: 0, messages: 0, sfc: 0 };
  }

  const Database = (await import('better-sqlite3')).default;
  const sqlite = new Database(file, { readonly: true });

  try {
    const destChats = Number(
      (await pool.query('SELECT COUNT(*)::int AS c FROM chats')).rows[0]?.c ?? 0,
    );
    const destSfc = Number(
      (await pool.query('SELECT COUNT(*)::int AS c FROM sfc_question_m')).rows[0]
        ?.c ?? 0,
    );

    let chats = 0;
    let messages = 0;
    let sfc = 0;

    if (destChats === 0) {
      const chatRows = sqlite.prepare('SELECT * FROM chats').all() as Array<{
        id: string;
        title: string;
        userId: string;
        createdAt: string;
        focusMode: string;
        files: unknown;
      }>;
      for (const row of chatRows) {
        await pool.query(
          `INSERT INTO chats (id, title, "userId", "createdAt", "focusMode", files)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)
           ON CONFLICT (id) DO NOTHING`,
          [
            row.id,
            row.title,
            row.userId ?? '',
            row.createdAt,
            row.focusMode,
            JSON.stringify(parseSqliteJsonValue(row.files, [])),
          ],
        );
        chats += 1;
      }

      const messageRows = sqlite
        .prepare('SELECT * FROM messages')
        .all() as Array<{
        id: number;
        type: string;
        chatId: string;
        userId: string;
        createdAt: string;
        messageId: string;
        content: string | null;
        sources: unknown;
      }>;
      for (const row of messageRows) {
        await pool.query(
          `INSERT INTO messages (id, type, "chatId", "userId", "createdAt", "messageId", content, sources)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
           ON CONFLICT (id) DO NOTHING`,
          [
            row.id,
            row.type,
            row.chatId,
            row.userId ?? '',
            row.createdAt,
            row.messageId,
            row.content,
            JSON.stringify(parseSqliteJsonValue(row.sources, [])),
          ],
        );
        messages += 1;
      }

      if (messageRows.length > 0) {
        await pool.query(
          `SELECT setval(pg_get_serial_sequence('messages', 'id'), COALESCE((SELECT MAX(id) FROM messages), 1))`,
        );
      }
    }

    if (destSfc === 0) {
      const sfcRows = sqlite
        .prepare('SELECT * FROM sfc_question_m')
        .all() as Array<{
        id: number;
        year: string;
        answerNo: string;
        questionNo: string;
        enLink: string | null;
        tcLink: string | null;
      }>;
      for (const row of sfcRows) {
        await pool.query(
          `INSERT INTO sfc_question_m (id, year, "answerNo", "questionNo", "enLink", "tcLink")
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [
            row.id,
            row.year,
            row.answerNo,
            row.questionNo,
            row.enLink,
            row.tcLink,
          ],
        );
        sfc += 1;
      }
    }

    return { skipped: false, chats, messages, sfc };
  } finally {
    sqlite.close();
  }
}
