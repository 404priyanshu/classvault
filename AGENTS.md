# ClassVault

A study platform for Indian college students, live at https://www.classvault.in
and starting with Bennett University. It has four parts: trusted notes, verified
campus communities, study rooms, and study roadmaps. As of 2026-09-24 it is
fully built for a pilot and has no real users: production holds a handful of
accounts and no notes. Demand is unproven, so the priority is getting students
using it, not adding features.

Dated history (migration-by-migration notes, acceptance-test records, OAuth and
SMS setup narratives) is in `docs/history/agents-md-2026-09-24.md`. Search it
when you need the background behind a decision; this file holds what is true
now.

## Stack

- Next.js 16 App Router (`src/app`), React 19, TypeScript, Tailwind 3 plus
  global CSS, Framer Motion. This Next.js has breaking changes from older
  versions: read the guide in `node_modules/next/dist/docs/` before using an API
  you are unsure of.
- Supabase: Postgres with row-level security, Auth, Storage, Realtime.
  Production project ref `hndgstbutlkjqnrxvqtm` (ap-south-1).
- npm with `package-lock.json`. pnpm is installed on the machine but is not used
  here.
- Hosting: Vercel project `classvault-g8qx` (`.vercel/project.json`). Scheduled
  workers run from GitHub Actions (`.github/workflows/scheduled-workers.yml`),
  not Vercel Cron.
- DNS: Hostinger zone for `classvault.in`, managed through the hostinger-dns
  MCP. It carries both the site and the mail records (see Operations).
- Mail: Supabase Auth sends through Resend SMTP as
  `ClassVault <no-reply@classvault.in>`.

## What exists

Everything below is implemented and in production.

- **Auth:** email and password, Google and GitHub OAuth, and phone OTP through
  Twilio Verify. The callback is `/auth/confirm` (PKCE or token hash). Cloudflare
  Turnstile protects sign-in, sign-up, password recovery, and OTP requests.
- **Onboarding:** a five-step setup (`src/components/onboarding`) that calls
  `complete_student_onboarding`. Membership is `verified` when the confirmed
  email matches the university's domain, otherwise `pending`.
- **Campus verification:** a pending student can change their sign-in email to
  their college address at `/dashboard/verification`. A trigger on `auth.users`
  verifies the membership once that address is confirmed (upgrade only). A
  manual review queue also exists; no reviewer is appointed, on purpose, until
  students are invited.
- **Notes:** upload (PDF, JPEG, PNG, WebP, up to 10 MiB, with signature and
  SHA-256 checks), a library with search and filters, detail pages with a
  private preview and signed download, ratings, the owner's vault with a 30-day
  Trash, reports and moderation, and full-text search over PDF text. Subjects
  are free-form: a new name becomes a campus subject, usable on public notes
  from that campus.
- **Roadmaps:** source-cited study plans built from notes the student can read,
  with private progress and revocable sharing. Gemini writes them when
  `GEMINI_API_KEY` is set (production has no key); otherwise a deterministic
  generator does. Only public notes are ever sent to the model.
- **Study rooms:** temporary public or campus rooms with a synchronized Pomodoro
  timer, host and co-host roles, chat, mute, remove, participant reports, and
  database-enforced rate limits. No video or audio.
- **Moderation and suspension:** `/dashboard/moderation` for note reports and
  room reports; admins can suspend accounts.
- **Usage metrics:** `record_usage_event` logs six events without search text.
  Platform admins read them at `/dashboard/usage`. The operator's account is the
  only platform admin.
- **Marketing page** (`src/components/landing`): its note, roadmap, and room
  demos use example data and are not connected to the product.

Not built: payments (ADR 0020 chooses Razorpay; nothing is integrated), room
video and audio, image OCR, and a production AI key.

## Where things are

- Routes: `src/app` (`auth/`, `onboarding/`, `dashboard/*`, `api/cron/*`).
- Server actions live next to their routes as `actions.ts`.
- Supabase clients: `src/lib/supabase` (`server.ts`, `client.ts`, `admin.ts` for
  the service role, `database.types.ts`).
- Feature logic: `src/lib/notes`, `src/lib/roadmaps`, `src/lib/study-rooms`,
  `src/lib/usage.ts`.
- Schema: `supabase/migrations`. Database tests (pgTAP): `supabase/tests`.
- Product rules: `docs/notes-product-data-permissions-spec.md`,
  `docs/study-room-product-data-permissions-spec.md`, and the decisions in
  `docs/adr/`.
- Email templates: `supabase/templates` (see Operations for the hosted copy).

## Rules

- Enforce ownership and campus access in Postgres (RLS and security-definer
  functions), not in the client. Hiding something in the UI does not protect it.
- On the server, authorize with `getClaims` or `getUser`, not `getSession`.
- The service-role key and `CRON_SECRET` are server-only; nothing secret goes in
  a `NEXT_PUBLIC_` variable. `.env.local` holds secrets: don't print or commit
  it.
- Add `"use client"` only where a component needs browser state or effects.
- Keep the clubhouse design (below) unless the user asks for a redesign. Reuse
  existing components and `src/assets` images before adding new ones.
- No invented metrics, testimonials, or user counts anywhere. Demo data is
  labeled as an example.
- The onboarding form keeps hidden fields for every step, because its server
  action needs the whole payload.
- Don't run `npm audit fix --force`.
- Changes go through a branch and a pull request, never straight to `main`.
  Merge only when the user says to.

## Design

The clubhouse look covers the whole app: periwinkle `#5b5fd7`, ink `#202044`,
paper `#fffdf5`, lavender `#e7e4fa`, butter yellow `#fff1a8`, and mint
`#dcebd7`, with rounded panels and heavy Inter headings. The colors are the
`club` Tailwind tokens, and shared primitives are in `src/app/globals.css`. The
landing page uses `Clubhouse.module.css`; sign-up and onboarding use
`src/components/journey/Journey.module.css`. The mark is `VaultMark`. The
spinner (`src/components/ui/spinner.tsx`) is the shared loading indicator.

## Development

```bash
npm run local:bootstrap   # start local Supabase, apply migrations, run pgTAP, write .env.local
npm run dev               # http://localhost:3000
npm run local:account     # dev@bennett.edu.in / classvault-dev, verified and onboarded (--admin adds platform_admin)
```

Development and every test run against the local Supabase stack in Docker,
never production. `npm run check:env` reports missing or production-pointing
values without printing them. `docs/staging.md` covers a hosted staging
project, which does not exist yet.

Before handing off a change:

```bash
npm test                    # Vitest
npm run typecheck
npm run lint
npm run build
npm run test:e2e            # public smoke tests; serves the build on port 3100
npm run test:e2e:signed-in  # signed-in journeys; local stack and a build made against it
npm run db:test             # pgTAP; trustworthy only on a freshly reset database
```

- The signed-in suite refuses any Supabase URL that is not local. It reads
  confirmation links from Mailpit (`127.0.0.1:54324`) and runs its server with
  `GEMINI_API_KEY` blank.
- CI (`.github/workflows/ci.yml`) runs all of these except pgTAP. The signed-in
  job starts its own Supabase stack on the runner and needs no secrets. Docker
  Hub rate limits occasionally fail that job; rerun it.
- After a migration, regenerate types from the local stack
  (`supabase gen types typescript --local`). Keep the `__InternalSupabase`
  header, and review the diff rather than replacing it wholesale: the checked-in
  types keep some stricter nullability on purpose.
- Test counts as of 2026-09-24: 199 Vitest, 29 smoke, 11 signed-in, and 470
  pgTAP across 20 suites.

## Operations

- **Migrations:** apply them with the CLI, never the dashboard, which records
  the wrong version. `npm run db:push` targets staging. For production, run
  `npm run db:push:production` from an up-to-date `main`, after a dry run
  (`ALLOW_PRODUCTION_DB_WRITE=1 node scripts/supabase-target.mjs --require-production && npx supabase db push --dry-run`).
  `db push` sends everything pending, so never run it from a feature branch.
  Production matches the repository at 46 migrations as of 2026-09-24;
  `npm run db:status` checks this.
- **Hosted settings that live outside the repo:** the Supabase dashboard does
  not read `supabase/config.toml`. Email templates (`confirmation.html`,
  `email-change.html`), auth providers, CAPTCHA, SMTP (Resend on port 465, not
  587, which times out), and the SMS limit (10 per hour) are set there by hand.
- **DNS:** the `www` CNAME target is specific to this Vercel project, and the
  apex MX points at Resend's inbound mail. Take a `DNS_getDNSSnapshotListV1`
  snapshot before editing the zone. The apex redirects to `www`.
- **Vercel environments:** Preview has only the public Supabase URL and
  publishable key. It runs a PR's code against production data under RLS, with
  no service-role key or cron secret. Development has no variables.

## Open items

- A second Vercel project, `classvault`, owned by another account (`akruti2`),
  builds every commit and reports as a PR check. Its owner is unconfirmed.
- Google sign-in shows the Supabase project domain, and its consent screen is in
  Testing. The Twilio account may still be a trial, so SMS reaches only verified
  numbers. Delivering SMS to Indian numbers may require TRAI DLT registration.
- Phone numbers get recycled, so a verified phone is not proof of identity or
  campus membership.
- Undecided: AI provider and evaluation, video/audio provider, analytics, and
  reviewer staffing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
