# ClassVault

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma)](https://www.prisma.io/)
[![pnpm](https://img.shields.io/badge/pnpm-11-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

ClassVault is an open-source campus study hub for notes, previous-year questions, uploads, moderation, and AI-assisted exam prep.

Built with Next.js App Router, React, TypeScript, Prisma, Postgres, custom cookie auth, Google OAuth, email OTP sign-up, upload moderation, and local or S3-compatible file storage.

> Status: active early project under MIT license. See [docs/roadmap.md](docs/roadmap.md) for planned features and [CONTRIBUTING.md](CONTRIBUTING.md).

## Contents

- [Highlights](#highlights)
- [Quick Start](#quick-start)
- [Environment](#environment)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Contributing](#contributing)

## Highlights

- Shared note library with search, filters, saves, ratings, downloads, and reporting.

## Screenshots

> Placeholder captures (replace with real screenshots/GIFs from `pnpm dev`).

- **Landing**: Hero, feature grid, study rooms teaser
- **Library**: Search/filters, trending strip, note cards (list/grid)
- **Note detail**: PDF preview drawer, threaded comments, ratings/saves
- **Review (staff)**: Pending uploads queue + open reports + B2B analytics strip
- **AI tools**: Roadmap generator + timeline; Exam Mode plan
- **Notifications**: Bell + unread list (comment + moderation events)
- **Collections**: Private list + public share page at `/c/[slug]`

Example flows:
- Uploading a note → staff review → published
- Threaded comments + bell notifications
- AI generated study roadmap
- Public shareable collections

See the demo at the Vercel preview or local `pnpm dev`.

## For Universities & Institutions (B2B)

ClassVault is designed for campus-wide adoption with a free tier for verified students (to maximize network effects and usage) plus paid institutional plans.

**Key paid value for universities** (see Admin Analytics in /app/review for staff/moderators):
- Ops dashboard: upload volume, approval/rejection rates, open reports, recent downloads, active users.
- Moderation tooling + compliance reports (ModerationEvent audit trail).
- Advanced AI (premium RAG "Ask your notes", higher quotas).
- Future: SSO, custom branding, per-campus scoping, usage-based billing, PWA.

**Pricing experiments** (see docs/roadmap.md):
- Students: Free core / $4-8/mo premium (unlimited AI, extra storage).
- Institutions: $1-4 per student/year or $3k-15k flat per campus for admin suite + advanced features.

**GTM / Pilots (self-sustainability path)**:
- Start with 1-2 small colleges for 3-mo paid pilots focused on admin analytics + moderation tooling (use existing /app/review + new analytics).
- Compliance hook: ModerationEvent + Report models provide full audit trail (resolve/dismiss via future staff actions; status already OPEN/RESOLVED/DISMISSED).
- Outreach: Target verified college admins (college-verified users + ADMIN_EMAILS). Seed demo data via `pnpm db:seed` (extend with multiple collegeNames).
- Cost control: Existing AI quota fallbacks + rate limits (extend for inst quotas per plan).
- Next: Full report resolution in lib/server/moderation + admin routes; Stripe checkout stubs; per-inst scoping in queries.

Contact for pilots: Use college verification flow or email admins listed in ADMIN_EMAILS env. 3-month paid pilots recommended to validate retention before scaling.
- Reviewed upload flow with staff approval, rejection, hiding, and restore actions.
- Google OAuth, password fallback, email OTP sign-up, and official college email verification.
- AI study tools for roadmaps, exam-mode prep, and upload metadata suggestions.
- Dashboard, leaderboard, saved library, review queue, comments, notifications, and study tasks.
- Thin API route handlers with reusable server logic under `lib/server/`.
- Vitest unit/integration tests and Playwright browser smoke tests.

## Tech Stack

| Area | Tools |
| --- | --- |
| App | Next.js App Router, React 19, TypeScript strict mode |
| Data | Prisma 7, Postgres, Neon-ready config |
| Auth | HTTP-only cookie sessions, Google OAuth, email OTP, password fallback |
| Storage | Local filesystem in dev, AWS S3-compatible direct uploads in prod |
| Email | AWS SES or Resend |
| AI | Gemini primary, OpenAI fallback |
| Quality | ESLint, Vitest, Playwright |

## Quick Start

Requirements:

- Node.js compatible with this repo's toolchain
- pnpm 11
- Postgres database

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

This project enforces pnpm through `package.json`.

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/sign-in`, `/sign-up` | Auth entry points |
| `/app/dashboard` | Signed-in study dashboard |
| `/app/library`, `/app/saved` | Notes and saved resources |
| `/app/add-resource` | Upload flow |
| `/app/college-vault` | Official college email verification |
| `/app/roadmaps`, `/app/exam`, `/app/rooms` | Study tools |
| `/app/leaderboard` | Contributor rankings |
| `/app/settings` | Profile settings |
| `/app/review` | Staff moderation queue |

## Environment

Copy `.env.example` to `.env`, then configure only what your local workflow needs.

| Area | Key vars |
| --- | --- |
| Core | `DATABASE_URL`, `APP_ORIGIN` |
| Admin bootstrap | `ADMIN_EMAILS` |
| Campus access | `ALLOWED_EMAIL_DOMAINS` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Email OTP | `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_OTP_SECRET` |
| Resend | `RESEND_API_KEY` |
| AWS SES | `AWS_SES_REGION`, `AWS_DEFAULT_REGION` |
| Storage | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_PUBLIC_BASE_URL` |
| Cloudflare R2 bookkeeping | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` |
| AI | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `AI_GEMINI_MODEL`, `AI_OPENAI_MODEL`, `AI_REQUEST_TIMEOUT_MS` |

Local dev notes:

- Missing email provider credentials print OTPs to the dev server console.
- Empty `AWS_S3_BUCKET` uses local file storage under ignored `var/storage/`.
- Keep AI provider keys server-side only. Do not prefix them with `NEXT_PUBLIC_`.

## Auth Setup

Google sign-in:

1. Create a Google OAuth web client in Google Cloud.
2. Add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
3. Set `APP_ORIGIN`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
4. Set `ALLOWED_EMAIL_DOMAINS` for campus-restricted access.

Email OTP:

1. Set `EMAIL_PROVIDER=ses`, `EMAIL_FROM`, and `AWS_SES_REGION` for AWS SES.
2. Or set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` for Resend.
3. Set a long random `EMAIL_OTP_SECRET` in production.

## Project Structure

```text
app/                 Next.js pages, layouts, and API route handlers
components/          Landing, shell, note UI, and app views
lib/                 Shared client-safe helpers and API types
lib/server/          Auth, DB, storage, AI, moderation, validation, rate limits
prisma/              Schema, migrations, and seed data
tests/               Vitest tests and Playwright specs
docs/                Build notes, roadmap, and release runbook
scripts/             Repo maintenance helpers
```

Important generated/local paths are ignored: `node_modules/`, `.next/`, `.pnpm-store/`, `.vercel/`, `coverage/`, `test-results/`, `playwright-report/`, `lib/generated/`, `prisma/dev.db*`, and `var/`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start local dev server |
| `pnpm build` | Generate Prisma client and build Next.js app |
| `pnpm start` | Serve production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript strict checks |
| `pnpm test` | Run Vitest tests |
| `pnpm test:e2e` | Run Playwright browser tests |
| `pnpm db:migrate` | Apply Prisma migrations locally |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |

## API Overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/sign-in`, `POST /api/auth/sign-out`, `GET /api/auth/google/start`, `GET /api/auth/google/callback`, `POST /api/auth/email/start`, `POST /api/auth/email/verify` |
| User | `GET /api/me`, `PATCH /api/me`, `POST/PATCH/DELETE /api/me/college-verification`, `GET/POST/PATCH /api/me/tasks` |
| Notes | `GET /api/notes`, `POST /api/notes`, `GET /api/notes/:id`, `POST/DELETE /api/notes/:id/save`, `POST /api/notes/:id/rating`, `POST /api/notes/:id/download`, `GET /api/notes/:id/file` |
| Uploads | `POST /api/uploads/presign`, `POST /api/uploads` |
| AI | `POST /api/ai/roadmap`, `POST /api/ai/exam`, `POST /api/ai/note-suggestions` |
| Community | `GET/POST /api/notes/:id/comments`, `PATCH/DELETE /api/comments/:id`, `GET /api/notifications`, `POST /api/notifications/read`, `GET /api/leaderboard` |
| Moderation | `GET /api/admin/notes`, `POST /api/admin/notes/:id/approve`, `POST /api/admin/notes/:id/reject`, `POST /api/admin/notes/:id/hide`, `POST /api/admin/notes/:id/restore`, `POST /api/reports`, `GET /api/admin/reports` |
| Health/meta | `GET /api/health`, `GET /api/health/deep`, `GET /api/meta` |

## Architecture Notes

- Route handlers stay thin; business logic lives in `lib/server/`.
- Sessions use HTTP-only cookies backed by the `Session` table.
- Password, Google, and email OTP sign-in all issue the same `classvault_session` cookie.
- New uploads start as `PENDING`; only `PUBLISHED` notes appear in public lists.
- Staff routes require `ADMIN` or `MODERATOR`.
- Upload, auth, verification, report, rating, download, and AI flows use DB-backed rate limits.
- Ratings and downloads are event rows plus cached aggregates on `Note`.
- S3 downloads use public base URLs when configured, otherwise short-lived signed URLs.

## Release Checklist

Run before a campus beta deploy:

```bash
pnpm prisma validate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Then verify a preview deployment:

- Sign in with Google and confirm callback URL.
- Upload a resource.
- Approve or reject it from `/app/review`.
- Confirm downloads/previews work.
- Confirm `/api/health/deep` reports DB healthy and S3 reachable when configured.

## Contributing

Contributions welcome once a license is added. Start with:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Pick a focused issue or small improvement.
3. Keep route handlers thin and preserve auth, rate limits, validation, moderation, and storage safety.
4. Add or update focused tests for behavior changes.

## Good first issues

Pick one of these small, self-contained tasks to start:

- Add one real screenshot/GIF to the Screenshots section (capture from `pnpm dev`; target library or review queue).
- Add a focused unit test for a pure helper (e.g. `lib/format.ts` or `lib/server/room-logic.ts`).
- Improve an error message or empty state copy in one view (e.g. empty library or failed upload).
- Document one additional API endpoint in the API Overview table with a short curl example.
- Triage 2–3 open issues and label them `good first issue` with clear scope.

Security reports should stay private. See [SECURITY.md](SECURITY.md).

## Maintainer Docs

- [Backend build guide](docs/backend-build-guide.md)
- [Release runbook](docs/release-runbook.md)
- [Product roadmap](docs/roadmap.md)

## License

No open-source license has been selected yet. Add a `LICENSE` file before making the repository public or accepting external reuse.
