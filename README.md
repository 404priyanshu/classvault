# ClassVault

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma)](https://www.prisma.io/)
[![pnpm](https://img.shields.io/badge/pnpm-11-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

ClassVault is an open-source campus study hub for notes, previous-year questions, uploads, moderation, and AI-assisted exam prep.

Built with Next.js App Router, React, TypeScript, Prisma, Postgres, custom cookie auth, Google OAuth, email OTP sign-up, upload moderation, and local or S3-compatible file storage.

> Status: active early project. No open-source license has been selected yet; add a `LICENSE` before treating this as a reusable OSS package.

## Contents

- [Highlights](#highlights)
- [Quick Start](#quick-start)
- [Environment](#environment)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Contributing](#contributing)

## Highlights

- Shared note library with search, filters, saves, ratings, downloads, and reporting.
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

Security reports should stay private. See [SECURITY.md](SECURITY.md).

## Maintainer Docs

- [Backend build guide](docs/backend-build-guide.md)
- [Release runbook](docs/release-runbook.md)
- [Product roadmap](docs/roadmap.md)

## License

No open-source license has been selected yet. Add a `LICENSE` file before making the repository public or accepting external reuse.
