# ClassVault

A shared library of notes, previous-year questions, and study resources for your class. Browse, save, rate, and upload — without digging through group chats.

Next.js App Router frontend + backend in one app: API route handlers under `app/api`, Prisma with Postgres, Zod validation, custom cookie sessions, Google OAuth, email OTP sign-up, DB-backed college verification, reviewed uploads, staff moderation, reports, and local/AWS S3-compatible file storage.

This project uses **pnpm only**. `package.json` enforces that during install.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:migrate   # create the Postgres schema
pnpm db:seed      # load demo users + notes
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — landing page
- `/app` — redirects to `/app/dashboard`
- `/app/dashboard` — study dashboard
- `/app/library` and `/app/saved` — browsable note collections
- `/app/add-resource` — file upload entry point
- `/app/college-vault` — official college email verification
- `/app/roadmaps`, `/app/exam`, `/app/rooms` — study tools
- `/app/settings` — profile settings
- `/app/review` — staff-only moderation queue

Google sign-in:

1. Create a Google OAuth web client in Google Cloud.
2. Add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
3. Set `APP_ORIGIN`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `.env`.
4. Set `ALLOWED_EMAIL_DOMAINS` for the campus beta, for example `classvault.edu`.

Email OTP sign-up:

1. For AWS SES, verify `EMAIL_FROM`, set `EMAIL_PROVIDER=ses`, and set `AWS_SES_REGION`.
2. For Resend, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM`.
3. Set a long random `EMAIL_OTP_SECRET` in production.
4. In local development without provider env vars, OTP emails are printed to the dev server console.

Production defaults:

- Host on Vercel.
- Use Neon Postgres for `DATABASE_URL`; use local Postgres for development.
- Use AWS S3 for direct uploads and signed downloads.
- Use AWS SES or Resend for email OTP delivery. SES sandbox accounts can only send to verified recipients until production access is approved.
- Set `ADMIN_EMAILS` before first sign-in to bootstrap admins.
- Authorized Google redirect URI: `${APP_ORIGIN}/api/auth/google/callback`.

## API

| Endpoint                        | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `POST /api/auth/sign-in`        | Password sign-in, returns the app session cookie |
| `POST /api/auth/sign-out`       | Destroy current app session                      |
| `GET /api/auth/google/start`    | Start Google OAuth sign-in                       |
| `GET /api/auth/google/callback` | Complete Google OAuth sign-in                    |
| `POST /api/auth/email/start`    | Send an email OTP for account creation           |
| `POST /api/auth/email/verify`   | Verify email OTP, create/link user, sign in      |
| `GET /api/health`               | Liveness + note count                            |
| `GET /api/health/deep`          | DB and S3 readiness check                        |
| `GET /api/me`                   | Current signed-in user                           |
| `PATCH /api/me`                 | Update profile name, department, semester        |
| `POST /api/me/college-verification` | Send official college email OTP              |
| `PATCH /api/me/college-verification` | Verify college OTP and mark user verified    |
| `DELETE /api/me/college-verification` | Disconnect college verification             |
| `GET /api/meta`                 | Filter options + dashboard stats                 |
| `GET /api/notes`                | List/search notes (`q`, `subject`, `semester`, `tag`, `saved`, `owner`, `limit`, `cursor`) |
| `POST /api/notes`               | Create pending note metadata for an uploaded file|
| `GET /api/notes/:id`            | One note                                         |
| `POST/DELETE /api/notes/:id/save`   | Save / unsave                                |
| `POST /api/notes/:id/rating`    | Rate 1–5 (upsert, returns fresh aggregates)      |
| `POST /api/notes/:id/download`  | Record download, returns download URL            |
| `GET /api/notes/:id/file`       | Stream, download, or inline-preview stored file  |
| `POST /api/uploads/presign`     | Create S3 upload target, or local upload fallback|
| `POST /api/uploads`             | Local multipart upload fallback                  |
| `GET /api/admin/notes`          | Staff moderation queue                           |
| `POST /api/admin/notes/:id/approve` | Publish pending note                         |
| `POST /api/admin/notes/:id/reject`  | Reject pending note with reason              |
| `POST /api/admin/notes/:id/hide`    | Hide published note                         |
| `POST /api/admin/notes/:id/restore` | Restore hidden note                         |
| `POST /api/reports`             | Report a published note                          |
| `GET /api/admin/reports`        | Staff report queue                               |

Architecture notes:

- Business logic in `lib/server/notes.ts`; route handlers stay thin.
- Auth uses HTTP-only app session cookies backed by the `Session` table. Password, Google sign-in, and email OTP sign-up all create the same `classvault_session` cookie.
- Google sign-in links by provider account ID, falls back to verified email linking, auto-creates first-time verified campus-domain users as `STUDENT` accounts, and promotes `ADMIN_EMAILS`.
- Email OTP sign-up stores only keyed hashes of short-lived codes, auto-creates first-time verified campus-domain users as `STUDENT` accounts, and promotes `ADMIN_EMAILS`.
- Password login remains for seeded/existing fallback users. New release access should use Google or email OTP.
- New uploads are `PENDING`; only `PUBLISHED` notes appear in the public library.
- Files are stored under `var/storage/` locally. With `AWS_S3_BUCKET` configured, browsers upload directly to AWS S3 and downloads use either `AWS_S3_PUBLIC_BASE_URL` or short-lived signed URLs.
- Staff routes use `requireRole("ADMIN", "MODERATOR")`.
- Ratings/downloads are event rows plus cached aggregates on `Note`; seeded aggregates fold into live averages.
- Abuse-sensitive APIs have DB-backed rate limits for sign-in, email OTP, college verification, upload, note creation, download, rating, and reports.

## Scripts

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Start dev server             |
| `pnpm build`     | Production build             |
| `pnpm start`     | Serve production build       |
| `pnpm lint`      | Run ESLint                   |
| `pnpm typecheck` | Run TypeScript in strict mode |
| `pnpm test`      | Run Vitest unit/integration tests |
| `pnpm test:e2e`  | Run Playwright browser smoke tests |
| `pnpm db:migrate`| Apply Prisma migrations      |
| `pnpm db:seed`   | Reset + seed demo data       |
| `pnpm db:studio` | Inspect the database         |

## Release Gates

Run these before a campus beta deploy:

```bash
pnpm prisma validate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Then deploy a Vercel preview, open `/sign-in`, confirm Google starts with the expected redirect URI, upload a resource, approve/reject it from the Review queue, and confirm `/api/health/deep` reports database healthy and S3 reachable when S3 is configured.

## Contributing

See `CONTRIBUTING.md` for setup, checks, and pull request expectations. Report vulnerabilities privately using `SECURITY.md`.

## License

No open-source license has been selected yet. Choose and add a `LICENSE` file before making the repository public.
