import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle/pg',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      process.env.PI_SESSION_DATABASE_URL ||
      '',
  },
});
