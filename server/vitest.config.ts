import path from 'node:path';
import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile(path.join(import.meta.dirname, '../.env'));
} catch {
  // no .env file — rely on the environment
}

/** Tests run against a separate Postgres schema so they never touch your real vault. */
function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL or TEST_DATABASE_URL to run tests');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('schema', 'test');
  return url.toString();
}

const databaseUrl = testDatabaseUrl();
process.env.DATABASE_URL = databaseUrl; // for globalSetup

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/globalSetup.ts'],
    env: { DATABASE_URL: databaseUrl, NODE_ENV: 'test', CLIENT_ORIGIN: '' },
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
