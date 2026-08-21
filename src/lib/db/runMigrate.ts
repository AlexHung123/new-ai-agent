import { runMigrations } from './migrate';

runMigrations()
  .then(() => {
    console.log('Postgres migrations finished');
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
