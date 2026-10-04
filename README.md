# DevVault

A personal knowledge vault for developers. Save the commands, snippets, fixes and links you learn, then find them again in seconds.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/vault-dark.png">
  <img alt="DevVault: the vault list with sidebar categories, tags and syntax-highlighted entries" src="docs/vault-light.png">
</picture>

## Features

- **Full CRUD** for entries: title, description, code/command, language, category, tags, source link, favorite
- **Fast search** across titles, descriptions, code and tags. It's debounced, and matches are highlighted in the results (including inside code)
- **Filters that combine**: category + tags (match all) + favorites + search + sort + pagination. All of it lives in the URL, so refresh, back/forward and bookmarks just work
- **Syntax highlighting** for 27 languages with [Shiki](https://shiki.style). Grammars load on demand, and light/dark themes switch with pure CSS
- **Keyboard first**: `/` or `Ctrl+K` search, `N` new entry, `Esc` clears search or closes dialogs, `Ctrl+Enter` saves a form
- **Polish**: optimistic favorite toggle, copy-to-clipboard, toasts, skeleton loaders, empty/error states with retry, a confirm dialog before deleting, a warning about unsaved changes, and long code collapsed on cards
- **Dark mode** follows your OS until you pick a theme, then remembers your pick
- **Responsive**: the sidebar becomes a drawer on mobile, with no horizontal scrolling at 375 px
- **Accessible**: labelled controls, visible focus rings, native `<dialog>` focus trapping, a skip link, and ARIA for the tag combobox

## Tech stack

| Layer      | Choice                                                                         |
| ---------- | ------------------------------------------------------------------------------ |
| Language   | TypeScript everywhere (npm workspaces: `client`, `server`, `shared`)           |
| Frontend   | React 19, Vite, React Router, Tailwind CSS v4, TanStack Query, React Hook Form |
| Backend    | Node, Express 5                                                                |
| Database   | PostgreSQL + Prisma                                                            |
| Validation | Zod schemas in `shared/`, used by both the form and the API                    |
| Tests      | Vitest + Supertest (API), Vitest + Testing Library (UI)                        |

## Getting started

Requires **Node 20+**.

```bash
git clone <repo> devvault && cd devvault
cp .env.example .env
docker compose up -d        # Postgres 16 on :5432
npm install
npm run db:setup            # run migrations + seed 12 categories and 16 sample entries
npm run dev                 # API on :4000, app on http://localhost:5173
```

**No Docker?** Run `npm run db:local` in a separate terminal instead of `docker compose up -d`. It downloads and starts a real embedded Postgres with the same credentials, storing its data in `server/.data/`. Everything else is the same.

### Scripts

| Command             | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | API (tsx watch) and client (Vite) together                   |
| `npm run db:setup`  | Apply migrations and seed (safe to re-run)                   |
| `npm run db:local`  | Docker-free local Postgres                                   |
| `npm test`          | API tests + UI tests                                         |
| `npm run typecheck` | `tsc` across all three packages                              |
| `npm run lint`      | ESLint                                                       |
| `npm run build`     | Bundle the API to `server/dist` and the app to `client/dist` |

API tests run against a separate `test` schema in the same database (or `TEST_DATABASE_URL`), so they never touch your vault.

## API

Base path `/api`. Every error has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": [{ "path": "title", "message": "Title is required" }]
  }
}
```

| Method | Path                    | Purpose                                         |
| ------ | ----------------------- | ----------------------------------------------- |
| GET    | `/entries`              | List / search / filter (see query params below) |
| GET    | `/entries/:id`          | One entry                                       |
| POST   | `/entries`              | Create → `201`                                  |
| PATCH  | `/entries/:id`          | Partial update                                  |
| PATCH  | `/entries/:id/favorite` | Body `{ "isFavorite": true }`                   |
| DELETE | `/entries/:id`          | Delete → `204`                                  |
| GET    | `/categories`           | `[{ id, name, slug, icon, count }]`             |
| GET    | `/tags`                 | `[{ name, count }]`, most used first            |
| GET    | `/stats`                | `{ total, favorites }`                          |

`GET /entries` query params: `q` (case-insensitive, searches title/description/content/tags), `category` (slug), `tags` (comma-separated, the entry must have all of them), `favorite` (`true`/`false`), `sort` (`updated` | `created` | `title`), `page`, `limit` (max 50).

Validation: title 1–120 chars, content 1–20,000 chars, `sourceUrl` must be an http(s) URL or empty, and at most 10 tags of 1–30 chars. Tags are lowercased, a leading `#` is dropped, spaces become `-`, and duplicates are removed. Tags no entry uses any more are deleted automatically.

## Project structure

```text
shared/   Zod schemas, constants and API types used by both sides
server/   Express app (routes → services → Prisma), migrations, seed, tests
client/   React app: api/ (fetch + query hooks), components/, pages/, hooks/, lib/
```

## Deploying

The repo includes configs for the stack in the plan: **Neon** (Postgres), **Render** (API, `render.yaml`) and **Vercel** (client, `vercel.json`). All three have free tiers.

1. **Database (Neon).** Create a project and copy the connection string. Use the **direct** one, not the `-pooler` host, because Prisma migrations need a direct connection. Keep `?sslmode=require` at the end.
2. **API (Render).** Go to Dashboard → New → **Blueprint**, then pick this repo. Render reads `render.yaml` and asks for:
   - `DATABASE_URL`: the Neon string from step 1
   - `CLIENT_ORIGIN`: your Vercel URL from step 3 (e.g. `https://devvault.vercel.app`). Put a placeholder for now and update it after step 3.

   Every start runs migrations and the seed. Both are idempotent: they create the 12 categories and add sample entries only to an empty vault. Check `https://<your-api>.onrender.com/api/health`, which should return `{"ok":true}`. Free instances sleep when idle, so the first request after a while takes about 30–60 s.

3. **Client (Vercel).** Go to Add New → Project, then import this repo. Keep the **root directory as the repo root** (`vercel.json` handles the monorepo build and SPA routing). Add the env var `VITE_API_URL` = `https://<your-api>.onrender.com` (no trailing `/api`), then deploy.
4. Back in Render, set `CLIENT_ORIGIN` to the real Vercel URL. Comma-separate several origins if you also use preview URLs.

There's no auth yet, so anyone with the URL can edit the demo. Keep the link private, or reset the data regularly, until single-user auth from the "Later" list lands.
