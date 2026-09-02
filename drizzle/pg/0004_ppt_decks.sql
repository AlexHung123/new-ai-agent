CREATE TABLE IF NOT EXISTS ppt_decks (
  "chatId" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  stage TEXT NOT NULL,
  deck JSONB NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ppt_decks_userId_idx ON ppt_decks ("userId");
