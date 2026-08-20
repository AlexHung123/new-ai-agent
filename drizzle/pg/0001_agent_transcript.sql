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
  ON agent_transcript_entries (agent_id, seq);
