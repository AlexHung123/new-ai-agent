import { randomUUID } from 'crypto';
import { Pool, type QueryResult } from 'pg';
import { getMaxToolResultChars } from '../agent/agentCompaction';
import type { CompactionCheckpoint } from './agentTranscriptCheckpoint';
import { checkpointToAgentMessage } from './agentTranscriptCheckpoint';
import {
  capAgentMessageForStorage,
  classifyKind,
  deserializeAgentMessage,
  estimatePayloadChars,
  findPruneStartIndex,
  isPureAppend,
  serializeAgentMessage,
  type TranscriptAgentMessage,
} from './agentTranscriptCodec';
import {
  getAgentTranscriptSettings,
  type AgentTranscriptSettings,
} from './agentTranscriptSettings';

export type TranscriptSyncResult = {
  mode: 'append' | 'replace' | 'skip';
  newWatermark: number;
  entryCount: number;
};

export type AgentTranscriptStore = {
  loadMessages: (
    agentId: string,
    env?: NodeJS.ProcessEnv,
  ) => Promise<TranscriptAgentMessage[]>;
  syncMessages: (args: {
    agentId: string;
    messages: TranscriptAgentMessage[];
    watermark: number;
    previousMessages?: TranscriptAgentMessage[];
    env?: NodeJS.ProcessEnv;
  }) => Promise<TranscriptSyncResult>;
  appendCheckpoint: (args: {
    agentId: string;
    checkpoint: CompactionCheckpoint;
    env?: NodeJS.ProcessEnv;
  }) => Promise<{ seq: number } | null>;
};

type TranscriptRow = {
  id: string;
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
};

type TranscriptRepo = {
  listAsc: (agentId: string) => Promise<TranscriptRow[]>;
  replaceAll: (agentId: string, rows: TranscriptRow[]) => Promise<void>;
  insertMany: (agentId: string, rows: TranscriptRow[]) => Promise<void>;
  deleteSeqLessThan: (agentId: string, minKeepSeq: number) => Promise<void>;
};

export type PgQueryFn = (
  sql: string,
  params?: unknown[],
) => Promise<Pick<QueryResult, 'rows'>>;

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS agent_transcript_entries (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  seq INT NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, seq)
);
CREATE INDEX IF NOT EXISTS agent_transcript_entries_agent_seq
  ON agent_transcript_entries (agent_id, seq)
`;

function asPayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* ignore */
    }
  }
  return {};
}

function createTranscriptStoreFromRepo(repo: TranscriptRepo): AgentTranscriptStore {
  return {
    async loadMessages(agentId, env = process.env) {
      const settings = getAgentTranscriptSettings(env);
      if (!settings.enabled) return [];

      const rows = await repo.listAsc(agentId);
      const newest = rows.slice(-settings.maxEntries);

      const selected: TranscriptRow[] = [];
      let chars = 0;
      for (let i = newest.length - 1; i >= 0; i--) {
        const c = estimatePayloadChars(newest[i].payload);
        if (selected.length > 0 && chars + c > settings.maxChars) break;
        selected.push(newest[i]);
        chars += c;
      }
      selected.reverse();

      const msgs = selected.map((r) => deserializeAgentMessage(r.payload));
      let from = 0;
      while (from < msgs.length && classifyKind(msgs[from]) === 'toolResult') {
        from += 1;
      }
      return msgs.slice(from);
    },

    async syncMessages(args) {
      const env = args.env ?? process.env;
      const settings = getAgentTranscriptSettings(env);
      if (!settings.enabled) {
        return {
          mode: 'skip',
          newWatermark: args.messages.length,
          entryCount: 0,
        };
      }

      const maxToolChars = getMaxToolResultChars(env);
      const capped = args.messages.map((m) =>
        capAgentMessageForStorage(m, maxToolChars),
      );

      const existing = await repo.listAsc(args.agentId);
      const hasRows = existing.length > 0;
      const existingMaxSeq = existing.reduce(
        (max, row) => Math.max(max, row.seq),
        0,
      );

      const prev =
        args.previousMessages ??
        (args.watermark > 0 ? capped.slice(0, args.watermark) : []);

      const canAppend =
        hasRows &&
        args.watermark > 0 &&
        isPureAppend(prev, capped) &&
        capped.length >= args.watermark;

      if (!canAppend) {
        await replaceAll(repo, args.agentId, capped, settings);
        return {
          mode: 'replace',
          newWatermark: capped.length,
          entryCount: Math.min(capped.length, settings.maxEntries),
        };
      }

      const suffix = capped.slice(args.watermark);
      if (suffix.length === 0) {
        return {
          mode: 'append',
          newWatermark: capped.length,
          entryCount: existingMaxSeq,
        };
      }

      let seq = existingMaxSeq;
      const data: TranscriptRow[] = suffix.map((m) => {
        seq += 1;
        return {
          id: randomUUID(),
          seq,
          kind: classifyKind(m),
          payload: serializeAgentMessage(m),
        };
      });
      await repo.insertMany(args.agentId, data);
      await pruneIfNeeded(repo, args.agentId, settings);
      return {
        mode: 'append',
        newWatermark: capped.length,
        entryCount: seq,
      };
    },

    async appendCheckpoint(args) {
      const env = args.env ?? process.env;
      const settings = getAgentTranscriptSettings(env);
      if (!settings.enabled) return null;

      const existing = await repo.listAsc(args.agentId);
      const seq =
        existing.reduce((max, row) => Math.max(max, row.seq), 0) + 1;
      const msg = checkpointToAgentMessage(args.checkpoint);
      await repo.insertMany(args.agentId, [
        {
          id: randomUUID(),
          seq,
          kind: 'compaction',
          payload: serializeAgentMessage(msg),
        },
      ]);
      await pruneIfNeeded(repo, args.agentId, settings);
      return { seq };
    },
  };
}

async function replaceAll(
  repo: TranscriptRepo,
  agentId: string,
  messages: TranscriptAgentMessage[],
  settings: AgentTranscriptSettings,
): Promise<void> {
  let toWrite = messages;
  if (toWrite.length > settings.maxEntries) {
    const start = findPruneStartIndex(toWrite, settings.pruneToEntries);
    toWrite = toWrite.slice(start);
  }
  const rows = toWrite.map((m, i) => ({
    id: randomUUID(),
    seq: i + 1,
    kind: classifyKind(m),
    payload: serializeAgentMessage(m),
  }));
  await repo.replaceAll(agentId, rows);
}

async function pruneIfNeeded(
  repo: TranscriptRepo,
  agentId: string,
  settings: AgentTranscriptSettings,
): Promise<void> {
  const rows = await repo.listAsc(agentId);
  if (rows.length <= settings.maxEntries) return;

  const msgs = rows.map((r) => deserializeAgentMessage(r.payload));
  const start = findPruneStartIndex(msgs, settings.pruneToEntries);
  if (start <= 0) return;
  const minKeepSeq = rows[start]?.seq;
  if (minKeepSeq == null) return;
  await repo.deleteSeqLessThan(agentId, minKeepSeq);
}

export function createMemoryAgentTranscriptStore(): AgentTranscriptStore {
  const byAgent = new Map<string, TranscriptRow[]>();
  return createTranscriptStoreFromRepo({
    async listAsc(agentId) {
      return [...(byAgent.get(agentId) ?? [])].sort((a, b) => a.seq - b.seq);
    },
    async replaceAll(agentId, rows) {
      byAgent.set(agentId, rows.map((r) => ({ ...r })));
    },
    async insertMany(agentId, rows) {
      const cur = byAgent.get(agentId) ?? [];
      byAgent.set(agentId, [...cur, ...rows.map((r) => ({ ...r }))]);
    },
    async deleteSeqLessThan(agentId, minKeepSeq) {
      const cur = byAgent.get(agentId) ?? [];
      byAgent.set(
        agentId,
        cur.filter((r) => r.seq >= minKeepSeq),
      );
    },
  });
}

export function createPgAgentTranscriptStore(options: {
  query: PgQueryFn;
}): AgentTranscriptStore {
  let ready: Promise<void> | null = null;
  const ensureTable = () => {
    if (!ready) {
      ready = options.query(CREATE_SQL).then(() => undefined);
    }
    return ready;
  };

  return createTranscriptStoreFromRepo({
    async listAsc(agentId) {
      await ensureTable();
      const result = await options.query(
        `SELECT id, seq, kind, payload
         FROM agent_transcript_entries
         WHERE agent_id = $1
         ORDER BY seq ASC`,
        [agentId],
      );
      return result.rows.map((row) => {
        const r = row as {
          id: string;
          seq: number;
          kind: string;
          payload: unknown;
        };
        return {
          id: String(r.id),
          seq: Number(r.seq),
          kind: String(r.kind),
          payload: asPayload(r.payload),
        };
      });
    },
    async replaceAll(agentId, rows) {
      await ensureTable();
      await options.query(
        `DELETE FROM agent_transcript_entries WHERE agent_id = $1`,
        [agentId],
      );
      for (const row of rows) {
        await options.query(
          `INSERT INTO agent_transcript_entries (id, agent_id, seq, kind, payload)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [row.id, agentId, row.seq, row.kind, JSON.stringify(row.payload)],
        );
      }
    },
    async insertMany(agentId, rows) {
      await ensureTable();
      for (const row of rows) {
        await options.query(
          `INSERT INTO agent_transcript_entries (id, agent_id, seq, kind, payload)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [row.id, agentId, row.seq, row.kind, JSON.stringify(row.payload)],
        );
      }
    },
    async deleteSeqLessThan(agentId, minKeepSeq) {
      await ensureTable();
      await options.query(
        `DELETE FROM agent_transcript_entries
         WHERE agent_id = $1 AND seq < $2`,
        [agentId, minKeepSeq],
      );
    },
  });
}

export function createPgAgentTranscriptStoreFromUrl(
  connectionString: string,
): AgentTranscriptStore {
  const pool = new Pool({ connectionString });
  return createPgAgentTranscriptStore({
    query: (sql, params) => pool.query(sql, params),
  });
}
