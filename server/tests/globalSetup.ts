import { execSync } from 'node:child_process';

/** Bring the test schema up to date. Tests clear their own rows, so nothing is reset here. */
export default function setup() {
  execSync('npx prisma migrate deploy', { stdio: 'pipe', env: process.env });
}
