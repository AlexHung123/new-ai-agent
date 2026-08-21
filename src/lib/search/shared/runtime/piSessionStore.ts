import { Pool, type QueryResult } from 'pg';

export type PiStoredSession = {
  templateId: string;
  messages: unknown[];
};

export type PiSessionStore = {
  exists: (agentId: string) => Promise<boolean>;
  load: (agentId: string) => Promise<PiStoredSession | null>;
  save: (agentId: string, session: PiStoredSession) => Promise<void>;
  close: () => Promise<void>;
};

export type PgQueryFn = (
  sql: string,
  params?: unknown[],
) => Promise<Pick<QueryResult, 'rows'>>;

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS pi_sessions (
  agent_id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  messages_json JSONB NOT NULL,
  updated_at BIGINT NOT NULL
)
`;

const SELECT_SQL = `
SELECT template_id, messages_json
FROM pi_sessions
WHERE agent_id = $1
`;

const UPSERT_SQL = `
INSERT INTO pi_sessions (agent_id, template_id, messages_json, updated_at)
VALUES ($1, $2, $3::jsonb, $4)
ON CONFLICT (agent_id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  messages_json = EXCLUDED.messages_json,
  updated_at = EXCLUDED.updated_at
`;

function parseMessages(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function createMemoryPiSessionStore(): PiSessionStore {
  const rows = new Map<string, PiStoredSession>();
  return {
    async exists(agentId: string) {
      return rows.has(agentId);
    },
    async load(agentId: string) {
      const row = rows.get(agentId);
      if (!row) return null;
      return {
        templateId: row.templateId,
        messages: JSON.parse(JSON.stringify(row.messages)),
      };
    },
    async save(agentId: string, session: PiStoredSession) {
      rows.set(agentId, {
        templateId: session.templateId,
        messages: JSON.parse(JSON.stringify(session.messages ?? [])),
      });
    },
    async close() {},
  };
}

export function createPgPiSessionStore(options: {
  query: PgQueryFn;
  close?: () => Promise<void>;
}): PiSessionStore {
  let ready: Promise<void> | null = null;

  const ensureTable = () => {
    if (!ready) {
      ready = options.query(CREATE_SQL).then(() => undefined);
    }
    return ready;
  };

  return {
    async exists(agentId: string) {
      return (await this.load(agentId)) !== null;
    },
    async load(agentId: string) {
      await ensureTable();
      const result = await options.query(SELECT_SQL, [agentId]);
      const row = result.rows[0] as
        | { template_id: string; messages_json: unknown }
        | undefined;
      if (!row) return null;
      return {
        templateId: row.template_id,
        messages: parseMessages(row.messages_json),
      };
    },
    async save(agentId: string, session: PiStoredSession) {
      await ensureTable();
      await options.query(UPSERT_SQL, [
        agentId,
        session.templateId,
        JSON.stringify(session.messages ?? []),
        Date.now(),
      ]);
    },
    async close() {
      await options.close?.();
    },
  };
}

export function createPgPiSessionStoreFromUrl(
  connectionString: string,
): PiSessionStore {
  const pool = new Pool({ connectionString });
  return createPgPiSessionStore({
    query: (sql, params) => pool.query(sql, params),
    close: async () => {
      await pool.end();
    },
  });
}
