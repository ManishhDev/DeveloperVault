# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**DevVault** is a single-user personal knowledge vault for developers (saved commands, snippets, fixes, links with fast search). `PLAN.md` is the source of truth for scope, schema, API contract, routes and milestones. Milestones M0–M4 are done. M5 (deploy) is not done. The README's "Deploying" section lists the environment variables it needs.

**Scope rule:** single user, no auth, no AI. Finish complete CRUD, fast search and a polished UI first. Anything in PLAN.md §9 "Later" (full-text search, import/export, auth, command palette, …) is out of scope unless explicitly requested.

## Commands

```bash
docker compose up -d     # Postgres 16 — or `npm run db:local` (embedded Postgres, no Docker; data in server/.data)
npm i                    # installs all workspaces
npm run db:setup         # prisma migrate deploy + seed (idempotent)
npm run dev              # API :4000 + Vite :5173 (proxies /api)
npm test                 # API tests (needs Postgres running) + UI tests
npm run typecheck && npm run lint
npm run build            # stop `npm run dev` first on Windows: it locks Prisma's engine DLL
```

To run one test file: `npm -w server exec vitest run tests/entries.test.ts` (or `-t "<name>"` for one test). API tests run against a separate `test` schema derived from `DATABASE_URL`, or `TEST_DATABASE_URL` if set. `tests/globalSetup.ts` applies migrations with `migrate deploy`, and each test clears its own rows. Prisma's CLI refuses destructive commands (`--force-reset`, `migrate reset`) when an AI agent runs them. Don't work around this. Ask the user to run them.

`.env` lives at the repo root. `server/prisma.config.ts` and `server/vitest.config.ts` load it with `process.loadEnvFile`, and the server's npm scripts pass `--env-file-if-exists=../.env`. Schema changes: edit `schema.prisma`, then `npm -w server run db:migrate -- --name <change>`.

## Architecture

npm workspaces monorepo, TypeScript throughout:

- **`shared/`**: `schemas.ts` has the Zod schemas (`entryCreateSchema`, `entryUpdateSchema`, `listQuerySchema`) and the types inferred from them. `constants.ts` has zod-free values (`LANGUAGES`, `SORTS`, `LIMITS`, `normalizeTag`), and `types.ts` has the API DTOs. **Both client and server import validation from here.** Never duplicate validation rules in either app. The package is TS source with `sideEffects: false`. The client main bundle imports only constants, which keeps zod out of it, so don't import schemas outside the form pages.
- **`server/`**: Express 5 (async handlers need no wrappers) + Prisma 6 + PostgreSQL. `app.ts` exports `createApp()` without listening, so Supertest can use it; `index.ts` starts it. Routes stay thin. Prisma queries go in `services/`. `validateBody` parses `req.body`. Express 5's `req.query` is read-only, so use `parseQuery`. A `ZodError` becomes a 400 in `errorHandler.ts`, and Prisma `P2025` becomes a 404. Every error has the shape `{ error: { code, message, details } }`. tsup bundles the server to `dist/` and inlines `@devvault/shared`.
- **`client/`**: Vite + React 19 + React Router (data router; `useBlocker` drives the unsaved-changes guard) + Tailwind v4 (class-based dark mode via `@custom-variant`). Server state goes through TanStack Query hooks in `src/api/entries.ts`. Every key lives under `['entries', …]`, so one invalidation refreshes both lists and detail views. The form routes are lazy-loaded. Shiki loads lazily from `lib/highlighter.ts`, fetches each grammar on demand, and uses dual themes through CSS variables. URL filter updates read `window.location.search` (`currentParams()`), not the render-time params, because navigations run in transitions.

### Key design decisions (span multiple layers)

- **One list endpoint does search, filter and pagination:** `GET /api/entries?q=&category=<slug>&tags=a,b&favorite=&sort=updated|created|title&page=&limit=`. `tags` uses AND semantics, `q` is a case-insensitive match over title, description, content and tag names, and `limit` is capped at 50. The response shape is `{ data, meta: { page, limit, total, totalPages } }`.
- **Search and filter state lives in the URL** (`/?category=linux&tags=search&q=grep`). The UI only builds the query string, so refresh, back and bookmarks all work. `/favorites` is the same list with `favorite=true`.
- **Edits use `PATCH`.** Favorite has its own `PATCH /entries/:id/favorite`, which the client applies optimistically.
- **Data model:** `Entry`, `Category` and `Tag`, with an implicit many-to-many between Entry and Tag. Categories are a fixed seeded set of 12 with no management UI. Tags are stored lowercase and trimmed, `connectOrCreate`d on save, and orphaned tags are deleted.
- **Validation limits:** title 1–120 chars, content 1–20,000, `sourceUrl` must be http(s) or empty, at most 10 tags of 1–30 chars.
- Create and edit share one form component. The UI is keyboard-first: `/` or `Ctrl+K` focuses search, `N` opens a new entry, `Esc` clears search or closes a modal, and `Ctrl+Enter` saves the form.
