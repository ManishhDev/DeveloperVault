# DevVault — Project Plan

A personal knowledge vault for developers: save commands, snippets, fixes and links you learn, then find them again in seconds.

**Scope rule:** single user, no auth, no AI. Ship complete CRUD + fast search + a polished UI first. Everything else goes in the "Later" list.

---

## 1. What changed from the original idea

| Original | Redesign | Why |
|---|---|---|
| One table, `category` and `tags` as plain fields | 3 small tables: `Entry`, `Category`, `Tag` (+ join) | Lets you count entries per category/tag, rename a tag once, and it teaches you real relations in Prisma. Still small. |
| No language field | `language` on each entry (`bash`, `ts`, `sql`, …) | Syntax highlighting needs to know the language. |
| "Global search" (unspecified) | One list endpoint with query params (`q`, `category`, `tags`, `favorite`, `sort`, `page`) | One endpoint covers search, filter and pagination; the UI only builds a URL. |
| `PUT` for everything | `PATCH` for edits + a dedicated favorite toggle | Toggling a star shouldn't resend the whole entry. |
| — | Shared Zod schemas used by client and server | Validation rules are written once. |
| — | Keyboard-first UX (`/` or `Ctrl+K` search, `N` new entry) | The main use is "I need that command *now*". Fast lookup is what makes it feel polished. |
| — | Search state lives in the URL | Back button, refresh and bookmarks all work. |

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Repo | npm workspaces monorepo: `client`, `server`, `shared` |
| Frontend | Vite + React + React Router + Tailwind CSS |
| Server state | TanStack Query (caching, optimistic favorite toggle) |
| Forms | React Hook Form + Zod resolver |
| Highlighting | Shiki (or `prism-react-renderer` if you want something lighter) |
| Icons / toasts | lucide-react, sonner |
| Backend | Node + Express |
| ORM / DB | Prisma + PostgreSQL (run locally with Docker Compose) |
| Validation | Zod (`shared` package) |
| Tests | Vitest + Supertest (API), Vitest + Testing Library (a few UI tests) |
| Lint/format | ESLint + Prettier |

---

## 3. Folder structure

```text
devvault/
├── package.json              # workspaces: client, server, shared
├── docker-compose.yml        # postgres:16
├── .env.example
├── README.md
├── shared/
│   └── src/
│       ├── schemas.ts        # Zod: entryCreate, entryUpdate, listQuery
│       └── types.ts          # inferred TS types
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts           # 12 categories + ~15 sample entries
│   └── src/
│       ├── index.ts          # starts the server
│       ├── app.ts            # express app (exported for tests)
│       ├── routes/
│       │   ├── entries.ts
│       │   ├── categories.ts
│       │   └── tags.ts
│       ├── services/
│       │   └── entries.service.ts   # Prisma queries live here
│       ├── middleware/
│       │   ├── validate.ts          # Zod -> 400
│       │   └── errorHandler.ts
│       └── lib/prisma.ts
│   └── tests/entries.test.ts
└── client/
    └── src/
        ├── main.tsx
        ├── App.tsx                  # routes
        ├── api/                     # fetch wrappers + query hooks
        │   ├── client.ts
        │   └── entries.ts           # useEntries, useEntry, useCreateEntry…
        ├── components/
        │   ├── layout/ (Sidebar, Topbar, AppLayout)
        │   ├── entries/ (EntryCard, EntryList, EntryForm, CodeBlock, TagInput)
        │   └── ui/ (Button, Input, Modal, ConfirmDialog, EmptyState, Skeleton)
        ├── pages/
        │   ├── VaultPage.tsx        # list + search + filters
        │   ├── EntryPage.tsx        # full detail view
        │   ├── NewEntryPage.tsx
        │   ├── EditEntryPage.tsx
        │   └── NotFoundPage.tsx
        ├── hooks/ (useHotkeys, useTheme, useDebounce, useUrlFilters)
        └── lib/ (copyToClipboard, formatDate)
```

---

## 4. Database schema (Prisma)

```prisma
model Entry {
  id          String    @id @default(cuid())
  title       String
  description String?
  content     String              // the command / code / solution
  language    String    @default("text")
  sourceUrl   String?
  isFavorite  Boolean   @default(false)
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])
  tags        Tag[]               // implicit many-to-many
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([categoryId])
  @@index([isFavorite])
}

model Category {
  id      String  @id @default(cuid())
  name    String  @unique
  slug    String  @unique
  icon    String              // emoji, e.g. "🐧"
  entries Entry[]
}

model Tag {
  id      String  @id @default(cuid())
  name    String  @unique       // stored lowercase, trimmed
  entries Entry[]
}
```

**Seeded categories:** Programming 💻, Linux 🐧, Networking 🌐, Database 🗄️, Git 🔧, React ⚛️, Node.js 🟢, Docker 🐳, DSA 🧠, AI/LLM 🤖, Debugging 🐛, Resources 📚.

Categories are fixed in the MVP; there's no UI to manage them. Tags are created on the fly. When you save an entry, its tags are `connectOrCreate`d, and tags with no entries left are removed.

---

## 5. API contract

Base: `/api`. JSON in, JSON out. Every error uses one shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ … ] } }
```

### Entries

| Method | Path | Purpose |
|---|---|---|
| GET | `/entries` | List / search / filter |
| GET | `/entries/:id` | One entry |
| POST | `/entries` | Create |
| PATCH | `/entries/:id` | Partial update |
| PATCH | `/entries/:id/favorite` | Body `{ "isFavorite": true }` |
| DELETE | `/entries/:id` | Delete → `204` |

**`GET /entries` query params**

| Param | Example | Notes |
|---|---|---|
| `q` | `grep` | Case-insensitive match on title, description, content, tag names |
| `category` | `linux` | Category slug |
| `tags` | `docker,networking` | Entry must have **all** listed tags |
| `favorite` | `true` | |
| `sort` | `updated` \| `created` \| `title` | Default `updated` (desc) |
| `page`, `limit` | `1`, `20` | Max limit 50 |

Response:

```json
{
  "data": [ { "id": "…", "title": "grep -R", "category": { "slug": "linux", "name": "Linux", "icon": "🐧" }, "tags": ["search", "files"], "…": "…" } ],
  "meta": { "page": 1, "limit": 20, "total": 37, "totalPages": 2 }
}
```

**Create / update body**

```json
{
  "title": "Recursive grep",
  "description": "Search recursively inside files",
  "content": "grep -R \"pattern\" .",
  "language": "bash",
  "categoryId": "…",
  "tags": ["search", "files"],
  "sourceUrl": "https://man7.org/…",
  "isFavorite": false
}
```

Validation: `title` 1–120 chars, `content` 1–20,000 chars, `sourceUrl` must be a valid http(s) URL or empty, at most 10 tags of 1–30 chars each.

### Categories & tags

| Method | Path | Returns |
|---|---|---|
| GET | `/categories` | `[{ id, name, slug, icon, count }]` |
| GET | `/tags` | `[{ name, count }]` sorted by count (feeds the tag filter + autocomplete) |
| GET | `/stats` | `{ total, favorites }` (sidebar counts) |

---

## 6. UI / pages

```text
┌──────────────────────────────────────────────────────────────┐
│ ◆ DevVault        [ 🔍 Search…            Ctrl+K ]  ☾  [+ New] │
├──────────────┬───────────────────────────────────────────────┤
│ 📥 All    37 │ Linux · 6 entries        Sort: Recently updated▾│
│ ⭐ Favs    5 │ Tags: [search ×] [+ filter]                     │
│              │ ┌───────────────────────────────────────────┐ │
│ CATEGORIES   │ │ Recursive grep                         ⭐ │ │
│ 💻 Program 4 │ │ 🐧 Linux · #search #files · 2d ago        │ │
│ 🐧 Linux   6 │ │ Search recursively inside files           │ │
│ 🔧 Git     5 │ │ ┌───────────────────────────────── 📋 ┐ │ │
│ ⚛️ React   3 │ │ │ grep -R "pattern" .                 │ │ │
│ …            │ │ └─────────────────────────────────────┘ │ │
│              │ │ 🔗 man7.org                    ✎  🗑     │ │
│ TOP TAGS     │ └───────────────────────────────────────────┘ │
│ #docker #ssh │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**Routes**

| Route | Page |
|---|---|
| `/` | Vault list. Filters come from the URL: `/?category=linux&tags=search&q=grep` |
| `/favorites` | Same list with `favorite=true` |
| `/entries/new` | Create form |
| `/entries/:id` | Detail: full code block, metadata, source link, edit/delete |
| `/entries/:id/edit` | Edit form (same component as create) |
| `*` | 404 |

**Entry form:** title, description, category select, language select, tag input with autocomplete (Enter or comma adds a tag), a monospace content textarea that keeps Tab inside the field, source URL, and a favorite toggle. `Ctrl+Enter` saves. Leaving with unsaved changes asks for confirmation.

**Polish checklist** (this is what makes it portfolio-worthy):
- Debounced search (300 ms) with matches highlighted in results
- Loading skeletons, empty states (no entries yet / no results / no favorites), error states with retry
- Optimistic favorite toggle; toasts for copy, save, delete
- Delete opens a confirm dialog
- Long code is collapsed on cards, with an "expand" button
- Dark mode follows the system by default, the toggle is remembered in `localStorage`, and code highlighting switches theme too
- Responsive: on mobile the sidebar becomes a drawer
- Keyboard: `/` or `Ctrl+K` focus search, `N` new entry, `Esc` clear search or close a modal
- Visible focus rings, labelled icon buttons, sufficient contrast

---

## 7. Milestones

Each milestone ends with something working.

**M0 — Setup (½ day)**
- [x] Monorepo with workspaces, TypeScript, ESLint/Prettier
- [x] `docker-compose.yml` for Postgres, `.env.example`
- [x] Prisma schema, first migration, seed script

**M1 — API (1–2 days)**
- [x] Express app, error handler, Zod validation middleware
- [x] Entries CRUD + favorite toggle
- [x] List endpoint with `q` / category / tags / favorite / sort / pagination
- [x] Categories, tags, stats endpoints
- [x] Supertest tests: create → list → filter → update → delete, plus validation failures

**M2 — Core UI (2 days)**
- [x] Layout: sidebar, topbar, routing
- [x] Vault list with entry cards and highlighted code
- [x] Create / edit form with tag input
- [x] Detail page, delete with confirm
- [x] Copy-to-clipboard

**M3 — Find things fast (1 day)**
- [x] Debounced search synced to the URL
- [x] Category + tag filters, favorites view, sorting, pagination or "load more"
- [x] Keyboard shortcuts

**M4 — Polish (1–2 days)**
- [x] Dark mode
- [x] Skeletons, empty/error states, toasts
- [x] Responsive layout + mobile drawer
- [x] Accessibility pass

**M5 — Ship (½ day)**
- [ ] Deploy: DB on Neon, API on Render/Railway, client on Vercel/Netlify (configs ready: render.yaml, vercel.json; needs accounts)
- [x] README: screenshot, features, stack, local setup, API table
- [ ] Seed the live demo with good-looking sample entries

---

## 8. Definition of done (MVP)

- Every CRUD path works from the UI and is covered by an API test
- Searching for a word in an entry's title, content or tags finds it
- Filters combine (category + tags + favorite + search) and survive a page refresh
- No layout breaks at 375 px width; dark and light both look intentional
- `git clone` → `docker compose up -d` → `npm i` → `npm run db:setup` → `npm run dev` works on a fresh machine

---

## 9. Later (only after the MVP ships)

Pick one at a time:
1. **Postgres full-text search** (`tsvector` column + GIN index, ranked results). This is a good learning upgrade from `ILIKE`.
2. **Import / export** the vault as JSON or Markdown.
3. **Markdown notes** field next to the code block.
4. **Multiple code blocks per entry** (e.g. "before / after").
5. **Command palette** (`Ctrl+K` opens results inline, arrow keys + Enter).
6. **Auth** (single-user login) so the deployed demo can't be edited by strangers. Until then, run the public demo read-only or reset it nightly.
7. Browser extension "save selection", AI tagging, semantic search: much later.
