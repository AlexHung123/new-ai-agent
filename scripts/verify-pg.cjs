const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(
  fs.readFileSync(path.join('data', 'config.json'), 'utf8'),
);
const url =
  process.env.DATABASE_URL ||
  config.databases?.agent?.connectionString ||
  config.databases?.secondary?.connectionString;

async function main() {
  const pool = new Pool({ connectionString: url });
  try {
    for (const table of ['chats', 'messages', 'sfc_question_m', 'pi_sessions']) {
      const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
      console.log(table, r.rows[0].c);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
