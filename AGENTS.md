# CLASSVAULT — AI PROJECT CONTEXT

```yaml
document:
  purpose: Canonical repository handoff for coding agents
  context_version: 24
  last_verified: 2026-08-24
  scope: Entire repository
  repository_root: /Users/ainz/projects/classvault
  source_of_truth_priority:
    - Current repository contents and executable behavior
    - This document
    - README.md
    - Marketing copy inside the landing page
```

## 1. Current state

```yaml
project_name: ClassVault
product_stage: Interactive landing-page prototype plus authenticated onboarding, notes, moderation, search, and deterministic study-roadmap generation slices
production_application_status: Auth, secure onboarding, notes upload/library/detail/lifecycle, moderation, permission-safe search, and deterministic source-cited study-roadmap generation are implemented and applied to hosted development
framework: Next.js 16.3.1
router: Next.js App Router
language: TypeScript
react: 19.2.0
styling: Tailwind CSS 3.4.19 plus global CSS
animation: Framer Motion
component_primitives: Radix UI / shadcn-style local components
package_manager: npm
canonical_lockfile: package-lock.json
git_repository: true
git_branch: main
git_remote: https://github.com/akrutitwari/classvault.git
deployment_configured: false
environment_variables_required: true
authentication_provider: Supabase Auth
authentication_methods_implemented:
  - email and password
  - Google OAuth application flow
  - GitHub OAuth application flow
  - phone SMS OTP application flow
authentication_provider_configuration:
  email_password: enabled in hosted Supabase
  google: operational end to end through a dedicated Google OAuth client and hosted Supabase
  github: operational end to end through a dedicated GitHub OAuth App and hosted Supabase
  phone: operational end to end through hosted Supabase and Twilio Verify
authentication_protection:
  captcha: Cloudflare Turnstile enabled in hosted Supabase for public email/password, password-recovery, and phone-OTP requests
  sms_rate_limit: 10 messages per hour across the hosted project
authentication_email_template: Branded ClassVault sign-up confirmation template implemented locally
authentication_email_sender_status: Custom SMTP deferred until the user owns a domain; hosted mail still identifies Supabase as sender
loading_feedback:
  shared_component: src/components/ui/spinner.tsx
  visual: Animated ClassVault pencil derived from the supplied loader component
  integration:
    - Auth form submissions
    - Dashboard sign-out
    - Onboarding completion
    - Interactive roadmap generation
    - Loading toasts
    - App Router route loading through src/app/loading.tsx
  accessibility: Exposes a status label when standalone, becomes decorative beside descriptive pending text, and respects prefers-reduced-motion
database: Supabase Postgres
supabase_project_ref: hndgstbutlkjqnrxvqtm
automated_test_suite: 72 Vitest tests, 12 Playwright browser smoke tests, 38 hosted pgTAP foundation tests, 38 hosted upload-pipeline pgTAP tests, 13 hosted library-access pgTAP tests, 29 hosted rating/ranking pgTAP tests, 20 hosted moderation pgTAP tests, 17 hosted search pgTAP tests, 39 hosted roadmap-authorization pgTAP tests, and 25 hosted roadmap-generation pgTAP tests
implemented_routes:
  - path: /
    type: statically rendered marketing page
  - path: /auth/sign-in
    type: dynamic email/password sign-in page
  - path: /auth/sign-up
    type: dynamic email/password registration page
  - path: /auth/forgot-password
    type: dynamic password-recovery request page
  - path: /auth/phone
    type: dynamic phone OTP request and verification page
  - path: /auth/update-password
    type: authenticated password update page
  - path: /auth/confirm
    type: PKCE/OTP confirmation route handler
  - path: /dashboard
    type: protected authenticated application shell
  - path: /dashboard/notes
    type: protected responsive RLS-filtered Notes Library with title search, subject/type/access filters, sorting, and pagination
  - path: /dashboard/notes/[noteId]
    type: protected note-detail route with safe contributor metadata and a five-minute private file preview
  - path: /dashboard/notes/[noteId]/download
    type: protected route handler issuing an authorized short-lived private download
  - path: /dashboard/notes/new
    type: protected responsive note draft/upload/publication workflow with stalled-response recovery
  - path: /dashboard/vault
    type: protected owner-only active uploads and 30-day Trash lifecycle
  - path: /api/cron/extract-notes
    type: server-only scheduled PDF extraction and permission-safe search indexing route
  - path: /dashboard/moderation
    type: protected scoped moderator queue for private reports and audited note actions
  - path: /dashboard/roadmaps
    type: protected deterministic roadmap request workspace with server-derived sources, generation recovery, and private saved summaries
  - path: /dashboard/roadmaps/[roadmapId]
    type: protected owner-only roadmap detail with source citations, withheld-section handling, and private task progress
  - path: /onboarding
    type: protected three-step student onboarding and profile editor
```

The repository is already flattened into `/Users/ainz/projects/classvault`. There
must not be another top-level wrapper directory named `app`. The framework's
standard route directory, `src/app`, is intentional and must remain.

This codebase was migrated from a generated Vite/React prototype to Next.js. The
migration is complete. Do not repeat it.

Supabase integration code and the first two database migrations are complete.
`.env.local` contains the hosted project URL and publishable key, and the hosted
Auth API was verified reachable on 2026-07-29. Migration
`20260729000000_create_profiles.sql` was applied to the hosted database on the
same date. Migration
`20260729010000_create_university_onboarding.sql` was also applied and a
follow-up dry run reported the hosted database up to date.

Migration `20260810000000_create_notes_foundation.sql` and follow-up hardening
migration `20260810010000_harden_notes_function_privileges.sql` were applied to
the hosted database on 2026-08-10 and recorded in migration history. They add
the notes relational foundation, private asset/search metadata boundaries,
rating/report/moderation tables, indexes, forced RLS, and reusable authorization
helpers. The follow-up migration explicitly removes hosted Supabase's default
`anon` function grants before granting only the intended helpers to
`authenticated`. The hosted 38-test pgTAP suite passed after hardening.

Migration `20260810020000_create_note_upload_pipeline.sql` is applied to hosted
Supabase. It adds the private `note-files` bucket, Storage RLS, and owner-derived
draft/upload/completion functions used by `/dashboard/notes/new`. Recovery
migrations `20260815000000`, `20260815010000`, and `20260815020000` make
completion idempotent, expose owner-only status checks, atomically claim failed
uploads before cleanup, and authorize exact cancelled-object removal. The
38-test upload pgTAP suite passed transactionally against hosted development on
2026-08-15.

Migration `20260816000000_add_note_library_access.sql` is applied to hosted
Supabase. It adds narrowly scoped authenticated functions for safe contributor
labels and ready-file metadata plus a private Storage select policy gated by
`can_consume_note(...)`. The 13-test library-access pgTAP suite passed
transactionally against hosted development on 2026-08-16.

The note rating, lifecycle, moderation, permission-safe search, and study
roadmap migrations through
`20260826030000_create_roadmap_generation_worker.sql` are applied to hosted
development. The search hardening migration explicitly grants its private
claim/completion RPCs to `service_role` while keeping them unavailable to
ordinary clients. The moderation follow-up qualifies report columns that
conflicted with `moderate_note(...)` output parameters.
The roadmap migration adds force-RLS static snapshots, automatic Free/Pro-ready
source selection, cited sections/tasks, private owner progress, and revocable
share tokens. The generation follow-up adds service-only claim/failure
transitions, private bounded source excerpts, source reauthorization, retry and
stale-claim handling, and deterministic provider tracking. The 17-test search,
39-test roadmap-authorization, and 25-test roadmap-generation pgTAP suites
passed transactionally against hosted development on 2026-08-24.

The canonical sign-up confirmation email is
`supabase/templates/confirmation.html` and is wired into the local stack through
`supabase/config.toml`. The hosted project still requires custom SMTP plus the
template to be applied in the Supabase Dashboard before Gmail will show a
ClassVault-owned sender instead of `Supabase Auth`.

Google and GitHub OAuth initiation, the PKCE callback, and phone OTP
request/verification are implemented in application code. Google OAuth is
configured through the dedicated `ClassVault Supabase` web client in Google
Cloud project `classvault-499208`; its hosted Supabase provider is enabled and
the returning-user flow through `/auth/confirm` to `/dashboard` passed on
2026-08-10. The Google consent screen remains external and in Testing status,
so access is limited to its configured test users. A brand-new Google user's
account creation, confirmation, onboarding completion, and university
membership assignment were verified on 2026-08-10. GitHub OAuth is configured
through the dedicated `ClassVault` OAuth App owned by the repository owner; its
hosted Supabase provider is enabled and a fresh GitHub identity successfully
reached `/onboarding` through `/auth/confirm` on 2026-08-10. After completing
onboarding, the same account signed out and returned directly to `/dashboard`;
its confirmed academic email produced the expected `verified` Bennett
University membership. The hosted Supabase Phone provider is configured with
Twilio Verify. Live SMS
delivery and six-digit OTP verification were confirmed working end to end on
2026-07-29. Migration
`20260729030000_allow_phone_onboarding.sql` allows phone-only users to complete
onboarding with a `pending` university membership. It was applied to the hosted
database on 2026-07-29, and a follow-up dry run reported the database up to
date.

Cloudflare Turnstile is integrated into the email sign-in, email sign-up,
password-recovery, initial phone-OTP request, and phone-OTP resend forms. Hosted
Supabase CAPTCHA enforcement is enabled with the Turnstile provider. On
2026-08-10, a request without a CAPTCHA token was rejected with
`captcha_failed`, while a token generated by the localhost ClassVault widget
passed CAPTCHA enforcement and reached normal credential validation. The
current Cloudflare widget allows `localhost`; deployment requires adding the
production hostname or creating a production widget and updating the public
site key. The hosted project-wide SMS send limit is 10 messages per hour.

### Authentication continuation state

```yaml
email_password:
  application_status: working
  hosted_provider_status: enabled
  sender_branding:
    local_html_template: supabase/templates/confirmation.html
    hosted_custom_smtp: deferred
    reason: User does not own a ClassVault domain yet
    current_sender_identity: Supabase-hosted sender

oauth:
  google:
    application_status: complete
    external_status: operational through dedicated Google web client and hosted Supabase provider
    google_cloud_project: classvault-499208
    google_oauth_client_name: ClassVault Supabase
    consent_screen_status: Testing
    hosted_provider_status: enabled
    returning_user_acceptance_test:
      status: pass
      confirmed_on: 2026-08-10
      verified_behavior:
        - OAuth initiation used the dedicated ClassVault client
        - Google redirected through the hosted Supabase callback
        - /auth/confirm exchanged the PKCE code for a cookie-backed session
        - A completed returning user reached /dashboard
    new_user_acceptance_test:
      status: pass
      confirmed_on: 2026-08-10
      verified_behavior:
        - A fresh Google identity created a confirmed Supabase Auth user
        - The user completed the protected onboarding flow
        - The profile stored the selected academic path, goal, and study preference
        - A non-academic Gmail address received the expected pending university membership
    secrets_policy:
      - The client secret is stored only in hosted Supabase provider settings
      - Never commit or expose the Google client secret
  github:
    application_status: complete
    external_status: operational end to end through dedicated GitHub OAuth App and hosted Supabase provider
    github_oauth_app_name: ClassVault
    homepage_url: http://localhost:3000
    hosted_provider_status: enabled
    new_user_acceptance_test:
      status: pass
      confirmed_on: 2026-08-10
      verified_behavior:
        - GitHub displayed the ClassVault authorization screen with read-only email access
        - GitHub redirected through the hosted Supabase callback
        - /auth/confirm exchanged the PKCE code for a cookie-backed session
        - A fresh GitHub identity reached /onboarding
    returning_user_acceptance_test:
      status: pass
      confirmed_on: 2026-08-10
      verified_behavior:
        - The GitHub user completed onboarding and reached /dashboard
        - The confirmed academic email received a verified university membership
        - Sign-out cleared the application session
        - Returning GitHub sign-in routed directly through /auth/confirm to /dashboard
    secrets_policy:
      - The client secret is stored only in hosted Supabase provider settings
      - Never commit or expose the GitHub client secret
  callback_route: /auth/confirm
  post_auth_routing:
    new_users: /onboarding
    completed_users: /dashboard through existing onboarding/dashboard gates

captcha:
  provider: Cloudflare Turnstile
  hosted_supabase_status: enabled
  application_status: complete for password, recovery, and phone OTP requests
  protected_actions:
    - email/password sign-in
    - email/password sign-up
    - password-recovery request
    - initial phone OTP request
    - phone OTP resend
  development_hostname: localhost
  acceptance_test:
    status: pass
    confirmed_on: 2026-08-10
    verified_behavior:
      - Hosted Supabase rejects protected requests without a CAPTCHA token
      - The ClassVault localhost widget produces a token accepted by hosted Supabase
      - Accepted CAPTCHA submissions continue to normal Auth credential validation
  production_requirement:
    - Register the production hostname with Cloudflare Turnstile before deployment
    - Keep the Turnstile secret only in hosted Supabase or server-only local environment variables

phone_otp:
  application_status: complete
  route: /auth/phone
  request_action: requestPhoneOtpAction
  verification_action: verifyPhoneOtpAction
  otp_length_expected_by_ui: 6
  number_format_sent_to_supabase: E.164
  country_selector:
    source: src/lib/auth/phone.ts
    default: India (+91)
    options: 23 commonly relevant countries
    behavior: Country code and national number are separate controls and are normalized server-side
  phone_only_onboarding:
    supported: true
    campus_membership_status: pending
    automatic_campus_verification: unavailable until a confirmed academic email exists
  hosted_sms_status: operational
  hosted_sms_hourly_limit: 10
  sms_provider: Twilio Verify
  hosted_provider_status:
    phone_enabled: true
    phone_signups_enabled: true
    validated_from: Supabase public Auth settings endpoint
    validated_on: 2026-07-29
  twilio_verify_status:
    service_credentials_valid: true
    service_reachable: true
    configured_code_length: 6
    validated_on: 2026-07-29
  hosted_configuration:
    - Enabled the Supabase Phone provider and phone sign-ups
    - Selected Twilio Verify rather than regular Twilio Messaging
    - Added the Twilio Account SID, Auth Token, and Verify Service SID to hosted Supabase
  acceptance_test:
    status: pass
    confirmed_on: 2026-07-29
    confirmed_by: User
    verified_behavior:
      - OTP request accepted through /auth/phone
      - SMS delivered through Twilio Verify
      - Six-digit phone OTP successfully verified
  resolved_incident:
    symptom: Twilio rejected a VA-prefixed Verify Service SID when it was supplied as a Messaging From sender
    cause: Hosted Supabase initially used regular Twilio Messaging instead of Twilio Verify
    resolution: Changed the hosted SMS provider to Twilio Verify and kept the VA-prefixed value in the Verify Service SID field
  secrets_policy:
    - Never commit the Twilio Auth Token
    - Hosted credentials belong in Supabase provider settings
    - Local Supabase secrets must use environment substitution
  trial_constraint: A Twilio trial may send only to destination numbers verified in the Twilio account
  production_requirements:
    - Upgrade Twilio and enable billing safeguards
    - Add CAPTCHA to the ClassVault phone flow before enabling CAPTCHA in Supabase
    - Review Supabase OTP and verification rate limits
    - Monitor SMS delivery and spend
    - Review Indian TRAI DLT and sender/template requirements before production delivery to Indian users
```

Useful official references:

- Supabase phone login: `https://supabase.com/docs/guides/auth/phone-login`
- Supabase Auth rate limits: `https://supabase.com/docs/guides/auth/rate-limits`
- Supabase CAPTCHA: `https://supabase.com/docs/guides/auth/auth-captcha`
- Twilio India SMS guidelines: `https://www.twilio.com/en-us/guidelines/in/sms`
- Twilio trial restrictions:
  `https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account`

## 2. Product intent

ClassVault is a proposed study platform for Indian college students. It addresses
two central problems:

1. Course notes are scattered across WhatsApp, Telegram, drives, and informal
   groups, making quality and trust difficult to judge.
2. Students often study alone without structured plans, accountability, or
   coordinated study sessions.

The product proposition has four pillars:

```yaml
product_pillars:
  trusted_notes:
    intent:
      - Upload, discover, download, and rate student notes
      - Rank quality using rating count and recency, not raw average alone
      - Support full-text search
    implementation_status: Upload, publication, browsing, private preview/download, ratings, ranking, owner My Vault, Trash recovery, scheduled purge, moderation, and permission-safe metadata/PDF full-text search are implemented; image OCR remains deferred

  verified_university_communities:
    intent:
      - Scope communities and content to universities
      - Verify membership using institution email domains
    implementation_status: Membership verification and notes authorization foundation implemented; university-scoped product UI is not implemented

  live_study_rooms:
    intent:
      - Video, audio, chat, and synchronized Pomodoro sessions
      - Keep a room active if its original host leaves
    implementation_status: UI simulation only

  ai_study_roadmaps:
    intent:
      - Generate study plans grounded in notes the student may access
      - Respect content permissions and university boundaries
    implementation_status: Deterministic source-cited generation, static snapshot/source authorization, retry recovery, owner progress, and revocable sharing are implemented; live AI model calls remain deferred and the landing-page demo remains scripted
```

Additional product concepts currently expressed in page copy:

- Pseudonymous profiles and no conventional social graph.
- University-scoped content and communities.
- Roadmaps shared only with users authorized to read their source notes.
- A 30-day recovery window for deleted notes.
- Admin moderation.
- Ratings weighted by volume and recency.
- A Free tier and a Pro tier advertised at ₹149/month.
- Core notes and study rooms are positioned as free.
- Pro is positioned as adding more AI generations, university-note roadmaps,
  larger rooms, host controls, and an ad-free experience.

These are product claims, not implemented or validated system behavior.

## 3. Accurate capability boundary

### Implemented

- Responsive, animated single-page marketing experience.
- Desktop and mobile navigation with anchor scrolling.
- Local interactive star-rating demonstration.
- Roadmap demonstration with:
  - topic input,
  - study-mode selection,
  - simulated AI console with an animated ASCII orb (src/components/ui/ascii-orb.tsx),
    typed agent log, and progress beam,
  - hard-coded phases streamed in with token-style typed tasks,
  - interactive checklist with a 100% completion badge,
  - calculated progress.
- Simulated study-room UI with an in-memory timer and fake chat activity.
- Draggable pain-point ("Sound familiar?") cards.
- FAQ accordion.
- Decorative global interactions and motion effects.
- Supabase SSR browser/server clients with cookie-backed sessions.
- Email/password registration, sign-in, sign-out, confirmation, and password
  recovery flows.
- Google and GitHub OAuth initiation with cookie-backed PKCE callbacks through
  `/auth/confirm`; both hosted providers are configured and operational.
- Phone OTP request and six-digit verification through `/auth/phone`.
- Cloudflare Turnstile protection for public password, recovery, and phone-OTP
  request forms, with server actions forwarding the token to hosted Supabase.
- A native phone country-code selector backed by `src/lib/auth/phone.ts`,
  defaulting to India (`+91`) and normalizing the selected code plus national
  number into E.164 before calling Supabase.
- Phone-only onboarding support. These accounts may complete a profile and
  receive a `pending` university membership without inventing an academic
  email.
- A reusable, accessible pencil spinner in `src/components/ui/spinner.tsx`,
  styled in the ClassVault palette and used for auth submissions, sign-out,
  onboarding completion, roadmap generation, loading toasts, and route-level
  loading.
- A protected `/dashboard` route using validated JWT claims.
- A typed `profiles` table migration with automatic Auth-user profile creation
  and owner-only row-level security.
- A protected, responsive three-step onboarding flow collecting identity,
  academic path, university, primary goal, and study preference.
- Degree selection is intentionally restricted to `MCA`, `BCA`, `B.Tech`, and
  `M.Tech`.
- University selection is an empty typeahead for new users. Results appear after
  two characters and search the active Indian university directory by name,
  short name, city, and state; a result must be selected to continue.
- Curated `universities`, `university_email_domains`, and
  `university_memberships` tables with RLS.
- The active university directory and its academic-domain reference rows are
  public read-only data for both `anon` and `authenticated`; all write
  privileges are revoked. Membership mutation and verification remain
  server-owned.
- Server-owned onboarding completion through
  `complete_student_onboarding(...)`, a `SECURITY DEFINER` database function
  that derives membership status from the authenticated user and confirmed Auth
  email rather than trusting client verification claims.
- Automatic `verified` membership when the confirmed email domain matches the
  selected university; otherwise the membership remains `pending`.
- Dashboard gating: signed-in users without `onboarding_completed_at` are sent
  to `/onboarding`; completed users may edit at `/onboarding?edit=1`.
- A Vitest foundation with 12 tests covering authentication server actions,
  onboarding completion, safe redirects, CAPTCHA forwarding, and session-proxy
  route protection.
- A hosted notes database foundation covering subjects, notes, private asset
  metadata, derived search documents, ratings and summaries, reports, platform
  roles, and append-only moderation actions.
- Forced RLS and least-privilege grants for notes metadata. Eligible students
  can read public notes; university notes require a current verified membership;
  owners retain Trash metadata; flagged content is visible only to appropriately
  scoped campus or platform moderators.
- Private `note_assets`, `note_search_documents`, and `platform_roles` tables
  have no direct authenticated read grant, and critical notes mutations have no
  direct client write grant.
- A 38-test hosted pgTAP suite covering table/function privileges, pending and
  incomplete users, cross-university direct-ID isolation, owner Trash access,
  private ratings/reports, moderator scope, and published-file/scope
  immutability.
- A protected `/dashboard/notes/new` workflow for PDF/JPEG/PNG/WebP notes up to
  25 MiB, with title, subject, note type, public-or-university scope,
  description, and normalized tags.
- A provider-agnostic browser/server storage boundary with Supabase Storage as
  the first private adapter. Files upload through a signed upload intent; the
  service-role key is used only by the server-side scheduled purge route and is
  never exposed to the browser.
- Browser and server file-signature detection for PDF/JPEG/PNG/WebP plus
  server-side byte-size and SHA-256 verification before save or publication.
- Migration `20260810020000_create_note_upload_pipeline.sql` defines the private
  `note-files` bucket, exact-object Storage RLS, and server-owned create,
  completion, and cleanup functions. It is applied to hosted Supabase.
- Recovery migrations make upload completion idempotent, provide owner-only
  status polling, and require an atomic cancellation claim before Storage
  cleanup. The form stops indefinite loading and reuses the existing upload for
  retry instead of creating duplicate drafts or objects.
- A 38-test upload-pipeline pgTAP suite covering privileges, onboarding and
  university eligibility, exact-object upload authorization, storage presence,
  checksum matching, idempotent publication, recovery isolation, cancellation
  races, and exact-object cleanup. It passed transactionally against hosted
  development on 2026-08-15.
- A responsive `/dashboard/notes` library backed by the authenticated Supabase
  session and existing note RLS. It supports title search, subject/type/access
  filters, newest/oldest sorting, exact RLS-scoped counts, and pagination.
- A protected `/dashboard/notes/[noteId]` detail experience with pseudonymous
  contributor data, rating summaries, scope metadata, a real private PDF/image
  preview, and an authorized five-minute signed download route.
- Library access helpers expose only safe contributor and ready-file fields
  after `can_consume_note(...)` succeeds. Raw `note_assets` and other students'
  profile rows remain unavailable to direct authenticated reads.
- A 13-test hosted library-access pgTAP suite covering function privileges,
  the Storage policy, eligible consumption, and onboarding-incomplete denial.
- Rating mutation and deterministic recency-weighted ranking. `rate_note(...)`
  rechecks consumption access, rejects self-ratings, upserts one 1-5 rating
  per student, and a private `refresh_note_rating_summary(...)` maintains
  Bayesian weighted summaries (365-day half-life, prior strength 8, cohort
  mean from raw peer ratings, 3.5 default) deterministically regardless of
  refresh order. An interactive star control with optimistic updates lives on
  the note-detail page.
- `list_notes_for_library(...)` applies access before ranking, filtering,
  exact counts, and pagination; it powers the Notes Library including the new
  "Top rated" sort with fully deterministic tie-breaking.
- Owner-only My Vault lifecycle is implemented at `/dashboard/vault`: active
  uploads, Trash, soft deletion, 30-day restoration, and safe status metadata.
  A server-only `/api/cron/purge-notes` route claims expired notes, removes
  private Storage objects, and finalizes metadata purge behind a cron secret.
- A 29-test hosted rating pgTAP suite covering privileges, eligibility,
  self-rating rejection, draft/campus denial, upsert semantics, exact summary
  math with cohort priors, ranked ordering, pagination, and lost-access
  revocation.
- Secure note reporting and scoped moderation are implemented through
  `report_note(...)`, `moderate_note(...)`, and read-only queue/owner-notice
  functions. `/dashboard/moderation` is visible only to campus or platform
  moderators; note detail pages expose a private report form and owners see
  only safe moderator messages in My Vault. The 20-test hosted moderation
  pgTAP suite covers report deduplication, self-report rejection, scoped
  actions, state transitions, restricted-note denial, and safe owner notices.
- Permission-safe full-text search is implemented for note metadata and
  extractable PDF text. `note_search_documents` is indexed with weighted
  metadata, `/api/cron/extract-notes` claims private ready files with the
  service role, extracts PDF text through `pdf-parse`, and records explicit
  `ready`, `failed`, or `unsupported` states. Library search returns snippets
  only after the existing note access predicate is applied. Image OCR remains
  deferred and image notes are searchable by metadata only.
- A protected `/dashboard/roadmaps` workflow exposes the authenticated
  student's automatically derived Free source pool and Pro-ready campus pool,
  accepts topic/study-mode requests, runs the server worker inline, polls active
  generation, and supports safe retries. Roadmap source selection is
  database-owned; the browser cannot supply note IDs, an owner, or a plan.
- Private roadmap tables store immutable source/title/scope snapshots, cited
  sections and tasks, owner-only progress, and revocable share tokens. Every
  owner/shared view rechecks each source: an unavailable source withholds the
  entire derived section, anonymous viewers can see public-only sections, and
  shared viewers never receive owner progress.
- The first provider-agnostic roadmap worker is implemented with the
  deterministic `deterministic-v1` provider. A service-role-only claim rechecks
  every source and returns bounded private excerpts only to the worker; strict
  Zod validation rejects unauthorized, duplicated, or omitted citations before
  saving. Live AI provider/model calls, prompting, and evaluation remain
  deferred.
- `/dashboard/roadmaps/[roadmapId]` renders the owner-only generated plan,
  cited sources, private checklist progress, and whole-section placeholders
  when a cited source is no longer authorized.
- A 39-test roadmap pgTAP suite covers least privilege, Free/Pro-ready source
  selection, old-campus owner sources, service-role snapshot saving,
  university isolation, anonymous public sections, progress privacy, token
  revocation, restricted-source hiding, and incomplete-user denial.
- A 25-test roadmap-generation pgTAP suite covers service-only function access,
  atomic claiming, private excerpts, source changes, no-source and retry states,
  stale claims, attempt limits, and safe failure transitions.
- A 72-test Vitest suite covering Auth, onboarding, route protection, file
  signatures, upload preparation, signed-upload intent creation, server-side
  completion, stalled-response recovery, retry preservation, and rejected-file
  cleanup, plus Notes Library query normalization, onboarding helpers, and
  rating-action validation, search/moderation helpers, roadmap formatting,
  deterministic output validation, worker behavior, and roadmap actions.
- A 12-test Playwright smoke suite (`npm run test:e2e`) covering the landing
  page, security headers, sign-in/sign-up/phone routes, unauthenticated
  redirects for protected routes including roadmap detail, and the interactive
  roadmap demo.

### Simulated or absent

```yaml
not_implemented:
  - Manual review/rejection workflow for pending university memberships
  - Payments or subscriptions
  - Live AI model calls, prompt orchestration, or model evaluation
  - Realtime infrastructure
  - WebRTC video/audio
  - Persistent chat
  - Analytics
```

Important simulation details:

- `RoadmapDemo.tsx` has two hard-coded phase sets: a default plan and an
  exam-revision plan. The entered topic changes displayed text but does not
  generate topic-specific content. Its build-log status lines are scripted
  animation theater, not a real generation pipeline.
- `StudyRoom.tsx` uses local/in-memory values. Participants, timer behavior, and
  messages are not connected to other users.
- The hero shows an honest "Early access — free while we build" badge; there are
  no live-user counters, invented statistics sections, or fabricated testimonials
  on the page. MarginNotes quotes are anonymous pain-point statements, not
  endorsements.
- Landing-page sign-up calls to action (hero, HowItWorks, demo captions,
  MarginNotes payoff, navbar, footer) open the real Supabase-backed auth routes.
  Demo teasers such as "Try the roadmap demo" still navigate to marketing-page
  anchors.
- The dashboard contains real note, moderation, search, and deterministic
  roadmap-generation slices. Study-room behavior and live AI roadmap generation
  remain demonstrations or deferred.
- All onboarding values are represented by persistent form controls even when
  their visual step is unmounted. Do not remove the hidden name, degree,
  graduation-year, university, goal, or study-preference fields: the final
  server action needs the complete multi-step payload.
- No source code currently uses Axios, Firebase, `localStorage`,
  `sessionStorage`, or WebSockets.

Never describe simulated behavior as production functionality.

## 4. Design canon

Treat the current UI, copy tone, and supplied image assets as the baseline design
system unless the user explicitly asks for a redesign.

```yaml
visual_direction:
  description:
    - Indian-campus editorial scrapbook
    - Academic notebook and archive imagery
    - Soft neo-brutalist interaction styling
  core_colors:
    paper_cream: "#f6f1e5"
    forest_green: "#17453a"
    saffron: "#f0a202"
    ink: "#171512"
  typography:
    body_and_ui: Inter
    display: Fraunces
    handwriting: Caveat
    loading: next/font/google in src/app/layout.tsx
  recurring_motifs:
    - Hard offset shadows
    - Dark ink borders
    - Stamps
    - Washi tape
    - Ruled paper
    - Dot grids
    - Paper grain
    - Vault and archive imagery
    - Doodles
    - Handwritten annotations
  motion_language:
    - Framer Motion entry animations and parallax
    - Marquees and calculated progress
    - Draggable margin-note cards
    - Custom cursor
    - CTA bursts
    - Scroll pencil
    - Night-study lamp effect
```

Design assets are local `.webp` files in `src/assets`. Reuse them through static
imports and `next/image`; do not replace them with remote images without a clear
reason.

## 5. Page composition

`src/app/page.tsx` composes the home page in this order:

1. `Navbar`
2. `Hero`
3. `UniversityTicker`
4. `HowItWorks`
5. `Features`
6. `RoadmapDemo`
7. `StudyRoom`
8. `MarginNotes`
9. `Pricing`
10. `FAQ`
11. `Footer`

`InteractiveFX` is mounted globally on the page to provide decorative
interaction effects.

## 6. Architecture map

```yaml
important_files:
  docs/notes-product-data-permissions-spec.md:
    role: Canonical notes-module product rules, relational model, RLS boundaries, ranking formula, lifecycle, and acceptance criteria
  supabase/migrations/20260810000000_create_notes_foundation.sql:
    role: Hosted notes tables, constraints, indexes, authorization helpers, privileges, seed subjects, and forced RLS policies
  supabase/migrations/20260810010000_harden_notes_function_privileges.sql:
    role: Explicit hosted removal of default anon/authenticated function grants and narrow authenticated helper grants
  supabase/migrations/20260810020000_create_note_upload_pipeline.sql:
    role: Hosted private bucket, exact-object Storage RLS, and server-owned draft/upload/completion operations
  supabase/migrations/20260815000000_harden_note_upload_recovery.sql:
    role: Idempotent completion, owner-only status recovery, and atomic cleanup claims
  supabase/migrations/20260816000000_add_note_library_access.sql:
    role: Safe note contributor/file metadata functions and consumable-note private Storage reads
  supabase/migrations/20260821000000_create_note_rating_mutation.sql:
    role: rate_note mutation, private deterministic summary refresh, and the access-first ranked library listing
  supabase/migrations/20260826000000_create_study_roadmap_foundation.sql:
    role: Private static roadmap snapshots, automatic plan-aware note selection, cited sections/tasks, progress privacy, revocable sharing, and view-time source authorization
  supabase/migrations/20260826030000_create_roadmap_generation_worker.sql:
    role: Service-role-only roadmap claims and safe failures with source reauthorization, bounded private excerpts, retry recovery, and generator tracking
  supabase/migrations/20260826010000_grant_note_search_worker_privileges.sql:
    role: Explicit service-role-only grants for search extraction claims and completion
  supabase/migrations/20260826020000_fix_moderation_report_status_updates.sql:
    role: Qualified report-state updates for reliable scoped moderation transitions
  supabase/tests/notes_rls.sql:
    role: 38 transactional pgTAP tests for notes privileges, tenant isolation, moderation scope, and immutability
  supabase/tests/note_upload_pipeline.sql:
    role: 38 hosted pgTAP tests for upload privileges, eligibility, recovery, cancellation races, verification, and publication
  supabase/tests/note_library_access.sql:
    role: 13 hosted pgTAP tests for contributor labels, ready-file metadata, and private download authorization
  supabase/tests/note_ratings.sql:
    role: 29 hosted pgTAP tests for rating eligibility, self-rating rejection, upsert semantics, summary math, cohort priors, deterministic ranking, pagination, and lost-access revocation
  supabase/tests/roadmap_authorization.sql:
    role: 39 transactional pgTAP tests for roadmap privileges, source selection, service-role snapshots, old-campus owner behavior, campus/public shares, progress privacy, revocation, and source-lifecycle denial
  supabase/tests/roadmap_generation.sql:
    role: 25 transactional pgTAP tests for service-only generation claims, private excerpts, retry/stale states, source changes, attempt limits, and safe failures
  scripts/run-pgtap-hosted.py:
    role: Runs pgTAP suites against the linked hosted project with full TAP output when Docker is unavailable
  src/app/dashboard/notes:
    role: Protected Notes Library, note-detail, private preview, and signed-download routes
  src/app/dashboard/notes/new:
    role: Protected note-upload route and validated server actions
  src/app/dashboard/roadmaps:
    role: Protected roadmap request/list/detail workflow with source eligibility, generation recovery, citations, and private progress
  src/app/dashboard/roadmaps/actions.ts:
    role: Authenticated create/retry/progress server actions with server-derived ownership
  src/components/roadmaps:
    role: Roadmap request, retry/polling, and private task-progress controls
  src/lib/roadmaps/generation.ts:
    role: Provider contract, deterministic provider, strict output schema, and complete authorized-source citation validation
  src/lib/roadmaps/worker.ts:
    role: Service-role claim, generation, validation, snapshot save, and safe failure orchestration
  src/components/notes/UploadNoteForm.tsx:
    role: Responsive private file, metadata, draft, and publication workflow
  src/components/notes/RatingStars.tsx:
    role: Client star-rating control with optimistic updates on note detail
  src/lib/notes/storage:
    role: Provider-agnostic note-file contract, file signatures, and Supabase browser/server adapters
  src/app/layout.tsx:
    role: Root layout, metadata, and next/font setup
  src/app/page.tsx:
    role: Server-rendered home-page composition
  src/app/globals.css:
    role: Global tokens, reusable visual primitives, texture, and animations
  src/sections/RoadmapDemo.tsx:
    role: Client-side simulated AI-roadmap experience
  src/sections/HowItWorks.tsx:
    role: Compact three-step signup-journey strip with honest early-access framing
  src/sections/StudyRoom.tsx:
    role: Client-side simulated live-study-room experience
  src/sections/InteractiveFX.tsx:
    role: Browser-dependent global visual interactions
  src/components/ui/accordion.tsx:
    role: Radix-based FAQ dependency
  src/hooks/use-mobile.ts:
    role: Hydration-safe media-query hook
  src/lib/supabase:
    role: Typed Supabase clients, environment validation, and session proxy
  src/app/auth:
    role: Authentication actions, pages, and confirmation route handler
  src/app/dashboard/page.tsx:
    role: Protected authenticated application entry point
  src/app/onboarding/page.tsx:
    role: Protected onboarding data loader and completed-profile redirect
  src/app/onboarding/actions.ts:
    role: Validated server action calling the onboarding database function
  src/components/onboarding/OnboardingFlow.tsx:
    role: Responsive three-step onboarding and profile-editing client flow
  supabase/migrations/20260729010000_create_university_onboarding.sql:
    role: University directory, domains, memberships, onboarding profile fields, RLS, seed data, and secure completion RPC
  supabase/migrations:
    role: Versioned Postgres schema and RLS migrations
  src/lib/utils.ts:
    role: Shared class-name utility
  src/assets:
    role: Local visual identity assets
```

Architecture notes:

- `src/app/page.tsx` is a server component.
- Interactive sections declare `"use client"` only where required.
- Browser media-query state uses `useSyncExternalStore` to avoid hydration
  mismatches.
- Local images use static imports with `next/image`.
- `components.json` identifies the component setup as shadcn-compatible with RSC
  and Next.js.
- `src/components/ui` contains only the primitives the app actually uses:
  accordion, ascii-orb, spinner, and stationery. The unused shadcn scaffold
  was removed on 2026-08-21 along with its dependencies. Re-add individual
  primitives deliberately if a new UI needs them.

## 7. Local development

```bash
npm install
npm run dev
```

Default development URL: `http://localhost:3000`

Required verification before handing off code changes:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run db:test
```

`npm run test:e2e` builds nothing itself; it starts the production server on
port 3100, so run `npm run build` first (the script order above does).

`npm run db:test` requires a running local Supabase/Postgres stack or an
explicitly connected test database. Without Docker, the pgTAP suites run
against the linked hosted project through
`python3 scripts/run-pgtap-hosted.py supabase/tests/<suite>.sql`, which uses
the Supabase CLI access token from the macOS keychain and prints full TAP
output. Search and both roadmap suites were last run transactionally against
the applied hosted schema on 2026-08-24.

Last verified baseline on 2026-08-24:

```yaml
vitest_tests: 72 passed
e2e_smoke_tests: 12 passed
hosted_notes_foundation_pgtap_tests: 38 passed
hosted_note_upload_pgtap_tests: 38 passed
hosted_note_library_access_pgtap_tests: 13 passed
hosted_note_rating_pgtap_tests: 29 passed
hosted_note_search_pgtap_tests: 17 passed
hosted_roadmap_authorization_pgtap_tests: 39 passed
hosted_roadmap_generation_pgtap_tests: 25 passed
typecheck: pass
lint: pass
production_build: pass
rendering:
  desktop: manually checked
  mobile: manually checked
  browser_console_errors: none observed
  horizontal_mobile_overflow: none observed
interactions_checked:
  mobile_menu: pass
  roadmap_generation: pass
  roadmap_checklist_progress: pass
  auth_page_navigation: pass
  auth_provider_options_desktop_render: pass
  auth_provider_options_mobile_render: pass
  phone_auth_route: pass
  phone_number_validation: pass
  phone_country_code_selector: pass
  auth_next_path_preservation: pass
  protected_route_without_session: pass
  hosted_supabase_auth_api: reachable
  hosted_database_migrations: applied and dry-run current
  hosted_notes_foundation_tables: 9
  hosted_notes_forced_rls_tables: 9
  hosted_notes_rls_policies: 6
  hosted_notes_seeded_subjects: 9
  onboarding_identity_step: pass
  onboarding_university_search: pass
  onboarding_email_domain_state: pass
  onboarding_study_preferences: pass
  onboarding_desktop_render: pass
  onboarding_mobile_render: pass
  confirmation_email_desktop_render: pass
  confirmation_email_mobile_render: pass
  confirmation_email_horizontal_mobile_overflow: none observed
  hosted_turnstile_missing_token_rejection: pass
  hosted_turnstile_valid_token_acceptance: pass
  hosted_sms_hourly_limit: 10
  note_upload_desktop_render: pass in external Chrome
  note_upload_mobile_400px_render: pass in external Chrome device mode
  note_upload_horizontal_mobile_overflow: none observed
  note_upload_browser_console_errors: none observed
  note_upload_native_required_field_validation: pass
  note_upload_sql_parser: pass
  note_upload_hosted_migration: pass
  note_upload_pgtap_execution: 38 passed transactionally against hosted development
  note_upload_live_publication: pass with acceptance artifact removed afterward
  note_upload_stalled_response_recovery: pass through automated hung-response coverage
  notes_library_desktop_1440x1000_render: pass in external Chrome
  notes_library_mobile_400x900_render: pass in external Chrome device mode
  notes_library_filters_and_empty_state: pass
  notes_library_horizontal_mobile_overflow: none observed
  note_detail_desktop_1440x1000_render: pass in external Chrome
  note_detail_mobile_400x900_render: pass in external Chrome device mode
  note_detail_private_pdf_preview: pass
  note_detail_signed_download: pass
  notes_library_browser_console_errors: none observed
```

Node tooling currently installed on the machine:

```yaml
node: 26.5.0
npm: 11.17.0
pnpm: 11.17.0
```

Despite pnpm being installed globally, this repository uses npm. Use
`package-lock.json` and npm commands unless the user explicitly requests a
package-manager migration. Do not introduce `pnpm-lock.yaml` or
`pnpm-workspace.yaml` incidentally.

## 8. Known risks and technical debt

1. Automated coverage includes 72 Vitest tests, a 12-test Playwright smoke
   suite (`npm run test:e2e`, unauthenticated flows only), 38 hosted
   notes-foundation pgTAP tests, 38 hosted upload-pipeline pgTAP tests, 13
   hosted library-access pgTAP tests, 29 hosted rating pgTAP tests, 17 hosted
   search pgTAP tests, 39 hosted roadmap-authorization pgTAP tests, and 25
   hosted roadmap-generation pgTAP tests.
   Authenticated upload/download journeys still rely on manual acceptance runs.
2. `npm audit --omit=dev` reported zero vulnerabilities as of 2026-08-21 after
   the Next.js 16.3.1 upgrade. Do not run `npm audit fix --force`; prefer a
   deliberate in-range upgrade verified by the full suite.
3. Marketing metrics, ratings, user counts, and university counts must not be
   presented as real analytics. The landing page deliberately uses honest
   early-access framing instead of invented statistics or fabricated
   testimonials; keep it that way.
4. The checked-in database types include the roadmap generation migration and
   preserve stricter application-known nullability where the Supabase CLI
   generator is more permissive. Compare against `npm run db:types` whenever
   migrations change; do not mechanically replace more accurate types.
7. Phone OTP sends can create direct variable cost and remain an abuse target.
   CAPTCHA and a 10-per-hour hosted SMS limit are configured; production still
   needs delivery/spend monitoring, billing safeguards, and a production
   Turnstile hostname.
8. Phone numbers can be recycled. Do not treat possession of a phone number as
   permanent proof of a student's identity or university membership.
9. Production SMS delivery to Indian users may require TRAI DLT registration
   and approved sender/template configuration depending on the delivery route.

## 9. Undecided product and infrastructure choices

No decision has been made for any of the following:

```yaml
open_decisions:
  - Manual review and evidence process for pending university memberships
  - File/object storage
  - Search engine
  - AI provider, models, prompting, evaluation, and grounding strategy
  - Realtime transport and video provider
  - Payment provider
  - Analytics
  - Hosting and deployment
```

The app requires the project URL and publishable key documented in `.env.example`.
The server-side note purge/extraction workers and roadmap generation require the
`SUPABASE_SERVICE_ROLE_KEY`; scheduled note workers additionally require
`CRON_SECRET`. Neither may be exposed through a `NEXT_PUBLIC_` variable.
`.env.local` contains working public hosted-project values but does not
currently contain the service-role key, so the roadmap UI intentionally disables
generation until the server is configured. `.env.local` is ignored by Git.
There is no deployment manifest or `.openai/hosting.json`.

Do not silently choose irreversible or expensive providers. For early local
implementation, prefer provider-agnostic boundaries and document assumptions.
Twilio Verify is the operational SMS provider. Its service credentials, hosted
Supabase Phone-provider configuration, live SMS delivery, and six-digit OTP
verification were validated on 2026-07-29.

## 10. Recommended implementation sequence

Unless the user gives a different priority, continue in this order:

1. Implement the durable realtime study-room foundation: room lifecycle,
   synchronized Pomodoro state, membership, and persistent chat boundaries.
2. Add manual review/rejection tooling for pending university memberships.
3. Evaluate and connect a live AI roadmap provider behind the existing worker
   contract only after choosing model, prompt, evaluation, cost, and privacy
   requirements.
4. Add billing and expanded moderation tooling.

Regenerate database types when the CLI environment supports it, and expand the
automated suite alongside each new product module.

This sequence is guidance, not authorization to build all items at once. Implement
only the scope requested by the user.

## 11. Agent operating constraints

```yaml
invariants:
  - Keep the repository root at /Users/ainz/projects/classvault.
  - Keep Next.js application routes under src/app.
  - Use the App Router; do not introduce the Pages Router without explicit need.
  - Use npm and preserve package-lock.json.
  - Preserve the established visual identity unless redesign is requested.
  - Reuse existing sections, UI primitives, and assets before adding equivalents.
  - Add "use client" only to components that require browser state or effects.
  - Do not imply that prototype interactions are backed by real services.
  - Use getClaims or getUser, never getSession, for server-side authorization.
  - Enforce ownership and university access with Postgres RLS.
  - Never expose a Supabase service-role key through NEXT_PUBLIC variables.
  - Do not use placeholder metrics as factual evidence.
  - Do not run npm audit fix --force.
  - Run typecheck, lint, and build after code changes.
  - Commit completed code and configuration changes after verification unless the user explicitly asks not to; do not create commits for read-only investigation.
```

When adding real application behavior, clearly separate:

- marketing/demo state,
- authenticated product state,
- server-owned data,
- access-control decisions,
- external provider integrations.

Any implementation involving university-scoped notes or AI roadmaps must enforce
authorization on the server. Hiding data in the client is not an access-control
mechanism.

## 12. Definition of the continuation point

The correct starting assumption for future work is:

> ClassVault currently has a visually complete Next.js landing-page prototype,
> Supabase authentication, a protected three-step onboarding flow, secure
> database-owned university membership assignment, and a protected dashboard.
> The profile and university-onboarding migrations are applied to the hosted
> project. Email/password works; Google OAuth is operational for both new and
> returning users through a dedicated Google client and hosted Supabase
> provider. GitHub OAuth is operational for both new and returning users through
> a dedicated OAuth App and hosted Supabase provider. Phone OTP
> is operational through hosted Supabase and Twilio Verify; live SMS delivery
> and six-digit OTP verification were confirmed working on 2026-07-29.
> Cloudflare Turnstile is enforced by hosted Supabase for public password,
> recovery, and phone-OTP requests, and the hosted SMS limit is 10 per hour.
> The repository has a 72-test Vitest foundation for Auth, onboarding,
> protected routes, file signatures, note-upload server actions, stalled
> completion recovery, rating actions, and library query normalization, plus
> a 12-test Playwright smoke suite for public
> routes, security headers, and the roadmap demo. The
> current Turnstile widget is registered for
> localhost, so deployment must add the production hostname or use a separate
> production widget.
> Custom SMTP sender branding is deferred until the user owns a domain. The
> notes product, relational model, access matrix, ranking formula, storage
> boundary, lifecycle, and acceptance criteria are specified in
> `docs/notes-product-data-permissions-spec.md`. The notes foundation and
> function-privilege hardening migrations are applied to hosted Supabase: nine
> forced-RLS tables, six read policies, reusable authorization helpers, and nine
> seeded global subjects passed 38 hosted pgTAP tests. The first notes UI now
> exists at `/dashboard/notes/new`: it creates owner-derived upload intents,
> uploads one private PDF/JPEG/PNG/WebP file through a provider boundary,
> validates file signatures and SHA-256 on the server, and saves a private
> draft or atomically publishes it. The upload pipeline and three recovery
> migrations are applied to hosted Supabase. Completion is idempotent, an
> owner-only status RPC recovers stalled responses, and cleanup cannot remove a
> ready/published object. The 38-test upload pgTAP suite and a live image
> publication acceptance test passed on 2026-08-15. The responsive Notes
> Library, note detail, private preview, and signed download are implemented
> through the existing RLS boundary; 13 hosted library-access pgTAP tests and
> live Chrome acceptance passed on 2026-08-16. Rating mutation and
> deterministic recency-weighted ranking are implemented: `rate_note` enforces
> eligibility, rejects self-ratings, upserts one 1-5 rating per student, and a
> private refresh maintains Bayesian weighted summaries (365-day half-life,
> prior strength 8, cohort mean from raw peer ratings with a 3.5 default).
> `list_notes_for_library` applies access before ranking and powers the
> library's "Top rated" sort. The 29-test rating pgTAP suite passed
> transactionally against hosted development on 2026-08-21. My Vault now
> provides owner-only active uploads and Trash views, soft deletion, 30-day
> restoration, and a server-only scheduled purge boundary. The 22-test
> lifecycle pgTAP suite passed against hosted development on 2026-08-23.
> Report intake, scoped moderation, and permission-safe metadata/PDF search are
> implemented in the repository and applied to hosted development. The
> study-roadmap workflow now provides server-selected static source snapshots,
> deterministic provider-agnostic generation, strict complete-source citation
> validation, private owner progress, retry recovery, revocable share tokens,
> and view-time source reauthorization at `/dashboard/roadmaps` and its detail
> route. The generation claim is service-role-only and private source excerpts
> never cross into the browser. The 17 search, 39 roadmap-authorization, and 25
> roadmap-generation pgTAP assertions passed transactionally against hosted
> development on 2026-08-24. The local server currently lacks
> `SUPABASE_SERVICE_ROLE_KEY`, so the UI safely disables generation until that
> secret is configured. Live AI model calls and study rooms remain deferred or
> demonstrations.
> New work should preserve the design language, enforce access in RLS/server code,
> and avoid confusing demonstrations with implemented product capabilities.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
