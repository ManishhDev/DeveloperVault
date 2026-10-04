import path from 'node:path';
import { defineConfig } from 'prisma/config';

// The .env file lives at the repo root; existing env vars (e.g. in CI or tests) win.
try {
  process.loadEnvFile(path.join(import.meta.dirname, '../.env'));
} catch {
  // no .env file — rely on the environment
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
