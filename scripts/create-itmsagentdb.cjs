const { Client } = require('pg');

const admin = {
  host: '192.168.56.150',
  port: 5432,
  user: 'postgres',
  password: 'pass1234',
  database: 'postgres',
};

const dbName = 'itmsagentdb';
const appUser = 'itmsagent';
const appPassword = 'P@ssw0rd1234';

async function main() {
  const root = new Client(admin);
  await root.connect();
  try {
    const existingDb = await root.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (existingDb.rowCount) {
      console.log(`database ${dbName} already exists`);
    } else {
      await root.query(`CREATE DATABASE ${dbName}`);
      console.log(`created database ${dbName}`);
    }

    const existingUser = await root.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [appUser],
    );
    const escapedPassword = appPassword.replace(/'/g, "''");
    if (existingUser.rowCount) {
      await root.query(
        `ALTER USER ${appUser} WITH PASSWORD '${escapedPassword}'`,
      );
      console.log(`updated password for role ${appUser}`);
    } else {
      await root.query(
        `CREATE USER ${appUser} WITH LOGIN PASSWORD '${escapedPassword}'`,
      );
      console.log(`created role ${appUser}`);
    }

    await root.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${appUser}`);
    await root.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO postgres`);
    console.log(`granted database privileges on ${dbName}`);
  } finally {
    await root.end();
  }

  const db = new Client({
    ...admin,
    database: dbName,
  });
  await db.connect();
  try {
    await db.query(`GRANT ALL ON SCHEMA public TO ${appUser}`);
    await db.query(`GRANT ALL ON SCHEMA public TO postgres`);
    await db.query(`ALTER SCHEMA public OWNER TO ${appUser}`);
    await db.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${appUser}`,
    );
    await db.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${appUser}`,
    );
    const ping = await db.query('SELECT current_database() AS db');
    console.log(`connected to ${ping.rows[0].db} and granted schema rights`);
  } finally {
    await db.end();
  }

  const app = new Client({
    host: admin.host,
    port: admin.port,
    user: appUser,
    password: appPassword,
    database: dbName,
  });
  await app.connect();
  try {
    const ping = await app.query('SELECT current_user AS u, current_database() AS db');
    console.log(`app login ok: user=${ping.rows[0].u} db=${ping.rows[0].db}`);
  } finally {
    await app.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
