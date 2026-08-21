CREATE TABLE IF NOT EXISTS user_files (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  format TEXT,
  "relDir" TEXT,
  parts INTEGER NOT NULL DEFAULT 0,
  "charCount" INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS user_files_userId_idx ON user_files ("userId");
