import configManager from '../config';

export function getAppDatabaseUrl(): string {
  const fromEnv = (
    process.env.PI_SESSION_DATABASE_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();
  if (fromEnv) return fromEnv;

  const fromAgent = String(
    configManager.getConfig('databases.agent.connectionString') || '',
  ).trim();
  if (fromAgent) return fromAgent;

  const fromSecondary = String(
    configManager.getConfig('databases.secondary.connectionString') || '',
  ).trim();
  if (fromSecondary) return fromSecondary;

  throw new Error(
    'PostgreSQL connection string missing. Set DATABASE_URL, PI_SESSION_DATABASE_URL, or databases.agent.connectionString.',
  );
}
