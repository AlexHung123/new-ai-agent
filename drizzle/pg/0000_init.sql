CREATE TABLE IF NOT EXISTS ran_migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  run_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "focusMode" TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "messageId" TEXT NOT NULL,
  content TEXT,
  sources JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS sfc_question_m (
  id INTEGER PRIMARY KEY NOT NULL,
  year TEXT NOT NULL,
  "answerNo" TEXT NOT NULL,
  "questionNo" TEXT NOT NULL,
  "enLink" TEXT,
  "tcLink" TEXT
);

CREATE TABLE IF NOT EXISTS pi_sessions (
  agent_id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  messages_json JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);
