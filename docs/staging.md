# Staging environment

Until now one hosted Supabase project (`hndgstbutlkjqnrxvqtm`, `ap-south-1`) backed
both local development and the production deployment. A migration run from a laptop
landed on live student data, and the pgTAP suites — which insert rows and roll them
back — ran against the same database. This document sets up a separate hosted
staging project and points this laptop at it.

Production is never the target of a command in this document. The guards in
`scripts/supabase-target.mjs` and `scripts/run-pgtap-hosted.py` enforce that; both
recognise the production ref and refuse unless `ALLOW_PRODUCTION_DB_WRITE=1` is set
deliberately, which is reserved for promoting a reviewed migration.

## What this repository can and cannot do

Automated by `scripts/bootstrap-staging.sh`: linking the CLI, applying migrations,
running every pgTAP suite, linking Vercel, pulling `.env.local`, and verifying it.

Not automatable — each needs a dashboard or an account decision:

| # | Action | Where | Why it cannot be scripted |
| --- | --- | --- | --- |
| 1 | Free a project slot, or upgrade the org | Supabase → Organization | The org is on the Free plan, which caps an owner at **2 active projects**, and `ClassVault` plus `priyanshu-co` already fill both. Pause or delete `priyanshu-co`, or move the org to Pro. |
| 2 | Create the `classvault-staging` project | Supabase → New project | Needs the slot from step 1 and a database password only you should hold. Use `ap-south-1` to match production latency and residency. |
| 3 | `npx supabase login` | This laptop | Opens a browser and writes a token to the macOS keychain. The CLI is currently signed out. |
| 4 | Staging Auth URL configuration | Supabase → Authentication → URL Configuration | Site URL `http://localhost:3000`, redirect allow list `http://localhost:3000/**` and `http://127.0.0.1:3000/**`. |
| 5 | Staging OAuth providers | Google Cloud, GitHub, Supabase → Auth → Providers | Client secrets live only in the provider settings. Add `https://<staging-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI on **the existing clients** — or create staging-only clients, which is cleaner but means a second consent screen and a second OAuth App. |
| 6 | Staging phone provider | Supabase → Auth → Providers → Phone | Optional. Twilio Verify costs real money per message; leave it disabled on staging unless a phone journey is being tested, and keep the trial's verified-number restriction in mind. |
| 7 | Staging SMTP | Supabase → Project Settings → Auth → SMTP | Resend, `smtp.resend.com` port **465** — not 587; on 587 the STARTTLS upgrade hangs past GoTrue's ten-second deadline and `/signup` returns a 504 that surfaces to the student as a CAPTCHA error. Sender `ClassVault <no-reply@classvault.in>`. Without it, staging mail falls back to Supabase's 2-per-hour team-addresses-only service, which is enough for solo testing but not for a multi-user walkthrough. |
| 8 | Staging confirmation email template | Supabase → Auth → Email Templates | The hosted dashboard does not read `supabase/config.toml`. Paste `supabase/templates/confirmation.html`; its only variable is `{{ .ConfirmationURL }}`. |
| 9 | Turnstile widget allowing `localhost` | Cloudflare → Turnstile | Put the **site** key in the Vercel Development environment and the **secret** key in Supabase → Auth → Attack Protection. The existing development widget already allows `localhost`; reuse it or create a staging widget. |
| 10 | Storage buckets | Applied by migrations | `note-files` and `profile-avatars` are created by `20260810020000` and `20260827000000`, so `db push` handles them. Nothing manual. |
| 11 | Scheduled workers against staging | GitHub → Actions, or a local curl | `.github/workflows/scheduled-workers.yml` drives production only. For staging, call the routes by hand (below) rather than adding a second schedule that would compete with production's. |
| 12 | Six Vercel **Development** variables | Vercel → classvault-g8qx → Settings → Environment Variables | The values are staging secrets; only you can read them out of the staging dashboard. |

## Sequence

### 1. Create the staging project

After freeing a slot (step 1 above), create `classvault-staging` in `ap-south-1`.
Record the project ref; everything below refers to it as `<staging-ref>`.

### 2. Sign the CLI in

```bash
npx supabase login
```

### 3. Add the six Development variables to Vercel

Values come from Supabase → **staging** project → Connect, and from Cloudflare.

| Variable | Value on staging |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<staging-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | staging publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service-role key — **server only** |
| `CRON_SECRET` | a fresh random string, not production's: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | the widget that allows `localhost` |

```bash
printf 'https://<staging-ref>.supabase.co' | vercel env add NEXT_PUBLIC_SUPABASE_URL development
```

Repeat per variable, or paste them in the dashboard. Do not copy production's
`SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET` into Development — a laptop holding a
production service-role key is the exact failure this separation exists to prevent.

Note that **Preview** currently carries production values too. Preview deployments
therefore write to live data. Repoint Preview at staging once staging is proven.

### 4. Bootstrap

```bash
scripts/bootstrap-staging.sh <staging-ref>
```

That links the CLI, pushes every migration, runs all twelve pgTAP suites, links
Vercel, pulls `.env.local` from Development, and verifies it. It is idempotent.

### 5. Finish the hosted configuration

Steps 4–9 in the table above — they are dashboard settings, so a migration cannot
carry them and a re-run of the bootstrap will not undo them.

### 6. Acceptance

Stage 1 is done when each of these works locally against staging and leaves
production untouched.

```bash
npm run check:env      # confirms .env.local is staging, not production
npm run dev
```

- Sign up with email and password; the confirmation mail arrives and `/auth/confirm`
  lands on `/onboarding`.
- Complete onboarding; a Bennett address yields a `verified` membership, anything
  else `pending`.
- Upload a PDF at `/dashboard/notes/new` and see it in the library.
- Generate a roadmap at `/dashboard/roadmaps`; it cites real sources.
- Create a room at `/dashboard/study-rooms` and run the timer.

Then drive the workers, which no schedule covers on staging:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/extract-notes
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/purge-study-rooms
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/purge-notes
```

`200` with a JSON body means the worker ran; `401` means `CRON_SECRET` does not match.
Extraction is what makes an uploaded PDF findable by its contents, so run it before
judging search.

Finally confirm production was not touched: its migration history should still end at
the last entry applied before this work began.

## Daily use afterwards

```bash
npm run db:target                 # which project am I pointed at?
npm run db:push                   # staging only; refuses production
npm run db:test:hosted            # every pgTAP suite against staging
npm run db:types                  # regenerate types from staging
```

`npm run db:push:production` exists for promoting a migration that staging has already
proven. It requires the production ref to be linked and is the only script that writes
there. Review the migration, run the suites on staging first, and expect it to be a
deliberate, separately reviewed act.

`npm run db:status` lists local versions against the linked project's recorded history.
Run it after any push. It is worth the habit: five migrations were applied to production
through the dashboard, which stamps the wall-clock time rather than the filename's
version, so the repository and production disagreed about five versions —
`lower_note_file_cap` through `keep_study_rooms_hosted`. Nothing was missing from
production, but `db push` would have tried to re-run all five, and neither
`create index study_rooms_university_id_idx` nor `create policy
"profile_avatars_select_own"` is idempotent. The files were renamed on 2026-09-22 to the
versions production actually recorded; repository and production now match exactly at 32
migrations, in the same order. Apply migrations through the CLI from now on so the
version in the filename is the version that gets recorded.

`src/lib/supabase/database.types.ts` keeps stricter nullability than the CLI generator
emits. Diff regenerated types rather than overwriting the file wholesale.
