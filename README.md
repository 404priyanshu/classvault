# ClassVault

A shared library of notes, previous-year questions, and study resources for your class. Browse, save, rate, and upload — without digging through group chats.

Next.js (App Router) frontend + backend in one app: API route handlers under `app/api`, Prisma with SQLite, Zod validation, and local filesystem storage for uploaded files. The original build plan lives in `docs/backend-build-guide.md`.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:migrate   # create the SQLite database
pnpm db:seed      # load demo users + notes
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — landing page (`components/class-vault-landing.tsx`)
- `/app` — the app: dashboard, library, saved, uploads, profile (`components/class-vault-app.tsx`)

## API

| Endpoint                        | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `GET /api/health`               | Liveness + note count                            |
| `GET /api/me`                   | Current user (temporary fixed session)           |
| `GET /api/meta`                 | Filter options + dashboard stats                 |
| `GET /api/notes`                | List/search notes (`q`, `subject`, `semester`, `tag`, `saved`, `owner`, `limit`, `cursor`) |
| `POST /api/notes`               | Create note metadata for an uploaded file        |
| `GET /api/notes/:id`            | One note                                         |
| `POST/DELETE /api/notes/:id/save`   | Save / unsave                                |
| `POST /api/notes/:id/rating`    | Rate 1–5 (upsert, returns fresh aggregates)      |
| `POST /api/notes/:id/download`  | Record download, returns download URL            |
| `GET /api/notes/:id/file`       | Stream the stored file                           |
| `POST /api/uploads`             | Multipart file upload, returns `storageKey`      |

Architecture notes:

- Business logic in `lib/server/notes.ts`; route handlers stay thin.
- Auth is a temporary `getCurrentUser()` in `lib/server/auth.ts` that resolves the seeded demo student — swap its internals for real session auth without touching endpoints.
- Files are stored under `var/storage/` (gitignored); `lib/server/storage.ts` is shaped so the functions can be swapped for S3/R2 presigned URLs.
- Ratings/downloads are event rows plus cached aggregates on `Note`; seeded aggregates fold into live averages.

## Scripts

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Start dev server             |
| `pnpm build`     | Production build             |
| `pnpm start`     | Serve production build       |
| `pnpm lint`      | Run ESLint                   |
| `pnpm db:migrate`| Apply Prisma migrations      |
| `pnpm db:seed`   | Reset + seed demo data       |
| `pnpm db:studio` | Inspect the database         |
