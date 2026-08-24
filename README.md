# ClassVault

ClassVault is a study platform concept for Indian college students. The repository
contains an interactive product landing page plus authenticated application
slices for Supabase authentication, student onboarding, university membership,
private note upload and discovery, moderation, permission-safe search, and
deterministic source-cited study roadmaps, plus temporary realtime study rooms.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Framer Motion
- Radix UI / shadcn
- Supabase Auth and Postgres

## Development

Install dependencies and start the local server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

The application expects these variables in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
# Server-only: required by note workers and roadmap generation.
SUPABASE_SERVICE_ROLE_KEY=service_role_REPLACE_ME
# Server-only scheduler authentication for note and study-room workers.
CRON_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
```

Use the project URL and publishable key from the Supabase project's Connect
dialog. The service-role key is required by the server-side note purge and text
extraction workers and by authenticated roadmap generation. It must never be
exposed to the browser or stored in a `NEXT_PUBLIC_` variable. The roadmap UI
remains safely disabled when this server-only key is not configured.

Link the repository to the hosted project and apply the database migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
npm run db:types
```

In Supabase Auth URL Configuration, use `http://localhost:3000` as the local site
URL and allow `http://localhost:3000/**` as a redirect URL. Add the production
origin before deployment.

### Authentication email branding

The canonical sign-up confirmation email lives at
`supabase/templates/confirmation.html`. The local Supabase stack uses it through
`supabase/config.toml`, with the subject `Confirm your ClassVault email`.

For the hosted project, configure custom SMTP before launch so recipients see a
ClassVault-owned sender instead of `Supabase Auth <noreply@mail.app.supabase.io>`.
Use:

- Sender name: `ClassVault`
- Sender address: a verified address such as
  `no-reply@auth.your-classvault-domain.com`
- Confirm-signup subject: `Confirm your ClassVault email`
- Confirm-signup body: the contents of
  `supabase/templates/confirmation.html`

Apply the subject and HTML in Supabase Dashboard under Authentication → Email
Templates → Confirm signup. Configure the sender under Project Settings →
Authentication → SMTP Settings. The SMTP password belongs in Supabase's hosted
settings, not in this repository or a `NEXT_PUBLIC_` environment variable.

For a fully local Supabase stack, install Docker Desktop or Podman, then run:

```bash
npm run supabase:start
npm run db:reset
```

The migrations create:

- `public.profiles` and its automatic Auth-user trigger.
- A curated university directory and trusted academic email domains.
- One row-level-secured university membership per student.
- A secure onboarding database function that assigns `verified` only when the
  selected university matches the user's confirmed Auth email domain; all other
  memberships remain `pending`.
- The notes data/RLS foundation plus a private `note-files` bucket and
  owner-derived draft/upload/publication functions.
- Owner-only My Vault controls at `/dashboard/vault`, including soft deletion,
  a 30-day Trash recovery window, restoration, and a privileged purge route at
  `/api/cron/purge-notes`.
- Private note reporting and scoped moderation at `/dashboard/moderation`.
  Students can report accessible notes without exposing their identity;
  campus/platform moderators can review, restrict, remove, restore, or hold
  notes through audited server-owned actions. Owners see only safe moderation
  messages in My Vault.
- Permission-safe full-text search across note titles, descriptions, tags, and
  extractable PDF text. The server-only `/api/cron/extract-notes` route claims
  private ready files, indexes PDF text, and marks image notes as
  metadata-searchable but OCR-unsupported.
- A deterministic, source-cited roadmap workflow with server-selected notes,
  service-role-only access to private excerpts, retryable generation state,
  private task progress, and view-time source reauthorization.
- Temporary public and verified-campus study rooms with server-owned plan
  limits, membership roles, a revision-checked synchronized Pomodoro timer,
  room-scoped chat, Supabase Realtime refresh, and scheduled expiry cleanup.

After sign-up and email confirmation, users are sent through `/onboarding`.
Completed profiles enter `/dashboard` and can manage their account at
`/dashboard/settings`. The settings page provides conventional profile-photo,
display-name, degree, graduation-year, account-identity, study-preference, and
password controls. Profile photos use a public Supabase Storage bucket with a
2 MiB JPG/PNG/WebP limit and exact owner-object write policies.

### Google, GitHub, and phone sign-in

The application-side flows are implemented, and the hosted development project
has Google, GitHub, and Twilio Verify providers configured:

- Google and GitHub use Supabase OAuth with the existing PKCE callback at
  `/auth/confirm`.
- Phone authentication uses `/auth/phone` to request and verify a six-digit SMS
  OTP.
- New social or phone users are sent to onboarding. Phone-only accounts can
  complete onboarding, but campus membership remains `pending` until an
  academic email can be verified.

Each provider must also be configured in any new Supabase environment before
its button can complete authentication.

For Google and GitHub:

1. Use `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` as the provider's
   authorization callback URL.
2. Create a Google Web OAuth client or GitHub OAuth App.
3. Add its client ID and client secret under Supabase Dashboard →
   Authentication → Sign In / Providers.
4. Keep `http://localhost:3000/**` in the Supabase redirect allow list during
   development, and add the production origin before launch.

For phone OTP:

1. Choose and configure a supported SMS provider in Supabase Authentication
   settings.
2. Enable the Phone provider.
3. Apply `20260729030000_allow_phone_onboarding.sql`.
4. Configure CAPTCHA and appropriate Auth rate limits. The hosted development
   project uses Cloudflare Turnstile and a 10-SMS-per-hour project limit.

SMS delivery has a direct cost. A production launch aimed at Indian numbers
must also account for applicable TRAI DLT registration and message-template
requirements.

## Notes module specification

The canonical implementation baseline for note upload, university boundaries,
private downloads, ratings, ranking, deletion, recovery, moderation, search,
and roadmap generation authorization is
[`docs/notes-product-data-permissions-spec.md`](docs/notes-product-data-permissions-spec.md).
The hosted schema/RLS foundation is implemented through migrations
`20260810000000_create_notes_foundation.sql` and
`20260810010000_harden_notes_function_privileges.sql`, with 38 transactional
pgTAP tests in `supabase/tests/notes_rls.sql`.

The first product route is `/dashboard/notes/new`. It accepts one PDF, JPEG,
PNG, or WebP file up to 25 MiB, checks the file signature and SHA-256, uploads
through a private signed Supabase Storage intent, and saves a draft or publishes
the note through server-owned database functions. The adapter is isolated
behind `src/lib/notes/storage` and does not require a service-role key.

Migration `20260810020000_create_note_upload_pipeline.sql` and the upload
recovery migrations dated `20260815` are applied to hosted Supabase. The 38
pgTAP assertions in `supabase/tests/note_upload_pipeline.sql` passed
transactionally against hosted development on 2026-08-15. Upload completion is
idempotent, stalled responses recover through owner-only status polling, and
cleanup atomically claims incomplete uploads before removing their exact
Storage object.

Migration `20260823000000_create_note_lifecycle.sql` adds the owner lifecycle
RPCs and purge-claim boundary. The 22 assertions in
`supabase/tests/note_lifecycle.sql` pass against hosted development. Configure
the server-only `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`, then schedule a
GET or POST request to `/api/cron/purge-notes` with `Authorization: Bearer
<CRON_SECRET>` to remove expired note storage and metadata safely.

The responsive Notes Library is available at `/dashboard/notes`. It queries
published notes through the signed-in user's existing RLS boundary, with title
search, subject/type/access filters, sorting, and pagination. Authorized note
details at `/dashboard/notes/[noteId]` include safe pseudonymous contributor
metadata, rating summaries, a five-minute private preview URL, and an expiring
download. Migration `20260816000000_add_note_library_access.sql` and the 13
transactional assertions in `supabase/tests/note_library_access.sql` protect
that private-file boundary.

The moderation workflow is available at `/dashboard/moderation`. Its report and
action mutations are exposed only through security-definer functions, with
moderator scope rechecked in the database. Migration
`20260824000000_create_note_moderation_workflow.sql` adds the workflow and the
20 assertions in `supabase/tests/note_moderation.sql` cover duplicate reports,
self-report rejection, scoped state transitions, restricted-note denial, and
safe owner notices. Follow-up migration
`20260826020000_fix_moderation_report_status_updates.sql` qualifies report-state
updates that otherwise conflicted with the function's output parameters.

The Notes Library now searches titles, descriptions, tags, subjects, and
extracted PDF text through the same access-filtered database function. Migration
`20260825000000_create_note_search_pipeline.sql` adds weighted search vectors,
safe snippets, extraction claims, and explicit extraction states. Schedule
`/api/cron/extract-notes` with the existing `CRON_SECRET` after uploads are
published; it requires the server-only `SUPABASE_SERVICE_ROLE_KEY`. Follow-up
migration `20260826010000_grant_note_search_worker_privileges.sql` grants only
that service role access to the extraction claim/completion RPCs. All 17 hosted
search pgTAP assertions pass.

The study-roadmap workflow is available at
`/dashboard/roadmaps`. Migration
`20260826000000_create_study_roadmap_foundation.sql` adds private static
roadmap snapshots, server-selected source-note boundaries, owner-only progress,
and revocable share tokens. Every saved or shared view rechecks current source
authorization and withholds an entire derived section if any cited note is no
longer available. Free source snapshots include personal uploads and public
notes; the entitlement boundary is ready to add accessible same-university peer
notes for Pro.

Migration `20260826030000_create_roadmap_generation_worker.sql` is applied to
hosted development. It adds service-role-only generation claims and safe
failure transitions, rechecks every selected source before returning private
excerpts to the worker, and supports retry and stale-claim recovery. The current
provider is deterministic and provider-agnostic: it produces a validated,
source-cited study plan without making an AI model call. Live AI provider,
prompting, model, and evaluation choices remain deferred. Generation requires
the server-only `SUPABASE_SERVICE_ROLE_KEY`; without it, the roadmap form stays
disabled instead of falling back to a client or authenticated content-writing
path. The 25 assertions in `supabase/tests/roadmap_generation.sql` and the 39
transactional assertions in
`supabase/tests/roadmap_authorization.sql` pass against the applied hosted
development schema.

## Study rooms

The authenticated study-room lobby is available at `/dashboard/study-rooms`.
Onboarding-complete students can create and join public rooms; university rooms
require a current verified membership at the same university. Room detail
provides a shared focus/break timer, host and co-host roles, pseudonymous member
snapshots, and temporary chat. The landing-page `StudyRoom` section remains a
separate visual demonstration.

Migrations `20260828000000_create_study_room_foundation.sql`,
`20260828010000_touch_rooms_on_membership_changes.sql`, and
`20260828020000_fix_study_room_timer_clock.sql`, plus the access-recheck
hardening migration `20260828030000_recheck_study_room_member_access.sql`, are applied to hosted
development. All writes use owner-derived database RPCs; direct table writes
are unavailable to authenticated clients. Forced RLS rechecks public/campus
access, and room/member/message Realtime events act only as refresh signals.
All 57 transactional assertions in `supabase/tests/study_rooms.sql` pass.

Rooms and their chat are ephemeral. They are deleted when ended, when the last
member leaves, or after expiry. Configure `SUPABASE_SERVICE_ROLE_KEY` and
`CRON_SECRET`, then schedule GET or POST requests to
`/api/cron/purge-study-rooms` with `Authorization: Bearer <CRON_SECRET>`.
Video/audio, durable chat, room moderation controls, and real Pro billing remain
deferred. The canonical access and lifecycle contract is
[`docs/study-room-product-data-permissions-spec.md`](docs/study-room-product-data-permissions-spec.md).

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run db:test
```

`npm run db:test` requires a running local Supabase/Postgres stack or a connected
test database.

## Structure

- `src/app` — Next.js layout, page, metadata, and global styles
- `src/app/auth` — sign-up, sign-in, confirmation, and password-recovery flows
- `src/app/auth/phone` — phone OTP request and verification flow
- `src/app/onboarding` — protected onboarding route and completion server action
- `src/app/dashboard` — authenticated application entry point
- `src/app/dashboard/notes` — RLS-filtered Notes Library and protected note detail
- `src/app/dashboard/notes/new` — note upload actions and protected route
- `src/app/dashboard/vault` — owner uploads, Trash, delete, and restore actions
- `src/app/dashboard/roadmaps` — private roadmap generation workspace and detail routes
- `src/components/roadmaps` — roadmap request, retry/polling, and task-progress controls
- `src/lib/roadmaps` — source snapshots, deterministic provider, validation, and server worker
- `src/app/api/cron/extract-notes` — authenticated scheduled PDF extraction worker
- `src/app/api/cron/purge-notes` — authenticated scheduler boundary for expired-note purge
- `src/components/notes` — responsive note-library and note-upload interfaces
- `src/lib/notes/storage` — replaceable storage contract and Supabase adapters
- `src/components/onboarding` — responsive onboarding experience
- `src/sections` — landing-page sections and interactive demonstrations
- `src/components/ui` — reusable shadcn/Radix UI primitives
- `src/lib/supabase` — typed browser/server clients and session utilities
- `src/assets` — local ClassVault illustrations and textures
- `docs/notes-product-data-permissions-spec.md` — notes product, data model,
  permissions, lifecycle, and acceptance criteria
- `supabase` — local config, branded auth email templates, seed file, and
  versioned database migrations
