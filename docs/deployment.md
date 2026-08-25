# Deployment

ClassVault is a Next.js App Router application with a hosted Supabase backend.
This document covers the first production deployment. Nothing here is automated:
each step needs an account or a dashboard the repository cannot reach.

## Before you start

The application will build and serve without these, but authentication will fail
in ways that look like bugs. Do them in order.

1. **A domain.** Everything else references it. Custom SMTP sender branding is
   also blocked until you own one.
2. **A production Turnstile widget.** The current site key is registered for
   `localhost` only, so the sign-up, password-reset, and phone-OTP forms will
   reject every submission on a real hostname. Create a widget for the
   production domain at Cloudflare → Turnstile, then set both the site key
   (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) here and the matching secret key in
   Supabase → Authentication → Attack Protection.
3. **Supabase URL configuration.** Set the Site URL to the production origin and
   add `https://YOUR_DOMAIN/**` to the redirect allow list. Keep
   `http://localhost:3000/**` for local work. OAuth callbacks and email
   confirmation links break silently without this.
4. **OAuth provider callbacks.** The Google client and GitHub OAuth App both
   point at `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`. That does
   not change per environment, but confirm it before launch.

## Environment variables

Set these in the Vercel project (or your host's equivalent) for the Production
environment. Values come from Supabase → Connect and from Cloudflare.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Publishable key, not the service role |
| `NEXT_PUBLIC_SITE_URL` | public | Production origin, no trailing slash |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public | Production widget only |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Note workers and roadmap generation |
| `CRON_SECRET` | **server only** | Long random string; authenticates the schedulers |

`SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` must never appear in a
`NEXT_PUBLIC_` variable. The roadmap form disables itself rather than falling
back to a client path when the service-role key is absent, so a misconfigured
deploy degrades visibly instead of leaking.

## Deploying to Vercel

```bash
npx vercel link
npx vercel --prod
```

The build runs `next build` with no special configuration. Security headers and
the production Content-Security-Policy come from `next.config.ts` and apply
automatically because `NODE_ENV` is `production`.

## Scheduled workers

Three routes must run on a schedule. Each requires
`Authorization: Bearer <CRON_SECRET>`.

| Route | Schedule | Why |
| --- | --- | --- |
| `/api/cron/extract-notes` | every 15 min | Indexes PDF text. Until it runs, a new note is not findable by its contents. |
| `/api/cron/purge-study-rooms` | every 30 min | Removes expired rooms and their chat. |
| `/api/cron/purge-notes` | daily, 02:00 UTC | Permanently removes notes past the 30-day Trash window. |

These run from `.github/workflows/scheduled-workers.yml`, **not** Vercel Cron.
The Vercel account is on the Hobby plan, which allows two cron jobs running once
per day; daily extraction would leave a note uploaded during an exam-week study
session unsearchable until the following day, which defeats the feature.

Add two repository secrets under Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `SITE_URL` | Production origin, no trailing slash |
| `CRON_SECRET` | The same value set in the Vercel environment |

The workflow fails the run on any non-200 response, so a rotated or mismatched
secret shows up as a red run rather than as notes that quietly never become
searchable. Use the **Run workflow** button to trigger any single worker by hand.

If the project later moves to a Vercel paid plan, replace the workflow with a
`crons` block in `vercel.json`. Vercel Cron sends the `Authorization` header
automatically when `CRON_SECRET` is set as an environment variable. Do not run
both schedulers at once.

Verify a route manually after deploying:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/purge-notes
```

A `401` means the secret does not match. A `200` with a JSON body means the
worker ran.

## Database migrations

Migrations are applied to the linked Supabase project, not by the deploy:

```bash
npm run db:push
npm run db:types
```

Review the generated types before committing them. The checked-in
`database.types.ts` preserves stricter nullability than the CLI generator
produces; do not mechanically overwrite it.

## Launch scope

`20260829000000_scope_launch_to_bennett.sql` deactivates every university except
Bennett, so onboarding offers one campus. To open another, set `is_active` back
to `true` for that row — the directory is already seeded and the RLS policy
filters on the flag, so no application change is needed.

## Still open before a public launch

- Terms and the takedown page carry placeholder operator, grievance-officer, and
  jurisdiction details. See `src/app/legal/contact.ts`.
- No privacy policy exists. The application collects email addresses, phone
  numbers, display names, and profile photos, which brings it under the Digital
  Personal Data Protection Act, 2023.
- Custom SMTP is unconfigured, so confirmation mail identifies Supabase as the
  sender.
- Phone OTP has a direct per-message cost. Monitoring and spend caps are not set
  up, and production delivery to Indian numbers may require TRAI DLT
  registration.
