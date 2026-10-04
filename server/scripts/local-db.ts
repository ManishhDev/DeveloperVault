/**
 * Docker-free Postgres for local development.
 * Runs a real Postgres server (embedded binaries) with the credentials from .env.example.
 * Keep it running in its own terminal, then use `npm run db:setup` and `npm run dev` as usual.
 */
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const databaseDir = path.join(import.meta.dirname, '../.data/postgres');
const port = Number(process.env.LOCAL_DB_PORT ?? 5432);

const pg = new EmbeddedPostgres({
  databaseDir,
  port,
  user: 'devvault',
  password: 'devvault',
  persistent: true,
  onLog: () => {},
});

if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) {
  console.log('Initialising a new Postgres cluster…');
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase('devvault');
} catch {
  // already exists
}

console.log(`Postgres is running on postgresql://devvault:devvault@localhost:${port}/devvault`);
console.log('Press Ctrl+C to stop.');

const shutdown = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
