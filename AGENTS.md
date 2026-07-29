# CLASSVAULT — AI PROJECT CONTEXT

```yaml
document:
  purpose: Canonical repository handoff for coding agents
  context_version: 11
  last_verified: 2026-07-29
  scope: Entire repository
  repository_root: /Users/akruti/projects/classvault
  source_of_truth_priority:
    - Current repository contents and executable behavior
    - This document
    - README.md
    - Marketing copy inside the landing page
```

## 1. Current state

```yaml
project_name: ClassVault
product_stage: Interactive landing-page prototype plus authenticated onboarding foundation
production_application_status: Auth, secure onboarding, and authenticated shell implemented; core product modules not implemented
framework: Next.js 16.2.12
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
  google: application code complete; external OAuth client and hosted Supabase provider configuration required
  github: application code complete; external OAuth app and hosted Supabase provider configuration required
  phone: operational end to end through hosted Supabase and Twilio Verify
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
supabase_project_ref: uiimhqaejwefahvbcsml
automated_test_suite: false
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
  - path: /onboarding
    type: protected three-step student onboarding and profile editor
```

The repository is already flattened into `/Users/akruti/projects/classvault`. There
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

The canonical sign-up confirmation email is
`supabase/templates/confirmation.html` and is wired into the local stack through
`supabase/config.toml`. The hosted project still requires custom SMTP plus the
template to be applied in the Supabase Dashboard before Gmail will show a
ClassVault-owned sender instead of `Supabase Auth`.

Google and GitHub OAuth initiation, the PKCE callback, and phone OTP
request/verification are implemented in application code. The Google OAuth
client and GitHub OAuth App have not been configured externally, so those
methods cannot complete against hosted Supabase yet. The hosted Supabase Phone
provider is configured with Twilio Verify. Live SMS delivery and six-digit OTP
verification were confirmed working end to end on 2026-07-29. Migration
`20260729030000_allow_phone_onboarding.sql` allows phone-only users to complete
onboarding with a `pending` university membership. It was applied to the hosted
database on 2026-07-29, and a follow-up dry run reported the database up to
date.

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
    external_status: Google OAuth client ID and secret not created/configured
  github:
    application_status: complete
    external_status: GitHub OAuth App client ID and secret not created/configured
  callback_route: /auth/confirm
  post_auth_routing:
    new_users: /onboarding
    completed_users: /dashboard through existing onboarding/dashboard gates

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
    implementation_status: Marketing concept only

  verified_university_communities:
    intent:
      - Scope communities and content to universities
      - Verify membership using institution email domains
    implementation_status: University selection and membership verification implemented; university-scoped content is not implemented

  live_study_rooms:
    intent:
      - Video, audio, chat, and synchronized Pomodoro sessions
      - Keep a room active if its original host leaves
    implementation_status: UI simulation only

  ai_study_roadmaps:
    intent:
      - Generate study plans grounded in notes the student may access
      - Respect content permissions and university boundaries
    implementation_status: UI simulation with hard-coded plan data
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
  - staged generation animation,
  - hard-coded phases,
  - interactive checklist,
  - calculated progress.
- Simulated study-room UI with an in-memory timer and fake chat activity.
- Draggable testimonial cards.
- FAQ accordion.
- Decorative global interactions and motion effects.
- Supabase SSR browser/server clients with cookie-backed sessions.
- Email/password registration, sign-in, sign-out, confirmation, and password
  recovery flows.
- Google and GitHub OAuth initiation with a cookie-backed PKCE callback through
  `/auth/confirm`; external provider credentials are still required.
- Phone OTP request and six-digit verification through `/auth/phone`.
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

### Simulated or absent

```yaml
not_implemented:
  - Live Google OAuth provider configuration
  - Live GitHub OAuth provider configuration
  - CAPTCHA protection for public authentication
  - University-scoped content authorization or tenancy policies
  - Manual review/rejection workflow for pending university memberships
  - Note upload, storage, download, deletion, or recovery
  - Real search or indexing
  - Payments or subscriptions
  - AI model calls
  - Retrieval-augmented generation or source grounding
  - Moderation tooling
  - Realtime infrastructure
  - WebRTC video/audio
  - Persistent chat
  - Analytics
```

Important simulation details:

- `RoadmapDemo.tsx` has two hard-coded phase sets: a default plan and an
  exam-revision plan. The entered topic changes displayed text but does not
  generate topic-specific content.
- `StudyRoom.tsx` uses local/in-memory values. Participants, timer behavior, and
  messages are not connected to other users.
- The hero live-user counter is randomized.
- Statistics and testimonials are marketing placeholders, not verified data.
- Landing-page sign-in and registration calls to action now open the real
  Supabase-backed auth routes. Other product calls to action still navigate to
  marketing-page anchors.
- The dashboard is an authenticated shell only; it does not yet contain notes,
  roadmaps, or study-room product functionality.
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
    - Marquees and counters
    - Draggable testimonial cards
    - Custom cursor
    - Click stamps
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
4. `Stats`
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
  src/app/layout.tsx:
    role: Root layout, metadata, and next/font setup
  src/app/page.tsx:
    role: Server-rendered home-page composition
  src/app/globals.css:
    role: Global tokens, reusable visual primitives, texture, and animations
  src/sections/RoadmapDemo.tsx:
    role: Client-side simulated AI-roadmap experience
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
- Most files in `src/components/ui` are unused scaffolding. The landing page
  currently depends directly on only a small subset, notably the accordion.
  Preserve the scaffold unless the user asks for cleanup.

## 7. Local development

```bash
npm install
npm run dev
```

Default development URL: `http://localhost:3000`

Required verification before handing off code changes:

```bash
npm run typecheck
npm run lint
npm run build
```

Last verified baseline on 2026-07-29:

```yaml
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
  onboarding_identity_step: pass
  onboarding_university_search: pass
  onboarding_email_domain_state: pass
  onboarding_study_preferences: pass
  onboarding_desktop_render: pass
  onboarding_mobile_render: pass
  confirmation_email_desktop_render: pass
  confirmation_email_mobile_render: pass
  confirmation_email_horizontal_mobile_overflow: none observed
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

1. There is no automated test suite.
2. Some currently unused shadcn-style components may contain Tailwind syntax
   associated with newer Tailwind versions, including forms such as
   `origin-(--...)` or `outline-hidden`. The current landing page builds because
   these components are not materially used. Normalize and verify a component
   before introducing it into a user-facing route.
3. `npm audit --omit=dev` previously reported three high-severity advisories in
   Next.js transitive dependencies involving `postcss` and `sharp`. The suggested
   npm force remediation would downgrade Next.js to 9.3.3 and is not acceptable.
   Re-evaluate on future Next.js upgrades.
4. Do not run `npm audit fix --force`.
5. Marketing metrics, testimonials, ratings, user counts, and university counts
   are placeholder content and must not be treated as real analytics.
6. The checked-in database types match the current migration manually. The
   Supabase CLI type generator attempted to require Docker even with a remote
   connection URL on this machine. Regenerate with `npm run db:types` after CLI
   login, or after installing Docker for a local stack.
7. Phone OTP sends can create direct variable cost and are an abuse target.
   Do not expose live SMS broadly until CAPTCHA, rate limits, monitoring, and
   billing safeguards are configured.
8. Phone numbers can be recycled. Do not treat possession of a phone number as
   permanent proof of a student's identity or university membership.
9. Production SMS delivery to Indian users may require TRAI DLT registration
   and approved sender/template configuration depending on the delivery route.

## 9. Undecided product and infrastructure choices

No decision has been made for any of the following:

```yaml
open_decisions:
  - Manual review and evidence process for pending university memberships
  - University-scoped authorization rules for future content
  - File/object storage
  - Search engine
  - AI provider, models, prompting, evaluation, and grounding strategy
  - Realtime transport and video provider
  - Payment provider
  - Moderation workflow
  - Analytics
  - Hosting and deployment
```

The app requires the project URL and publishable key documented in `.env.example`.
`.env.local` contains working hosted-project values and is ignored by Git. No
service-role key is required by the application. There is no deployment manifest
or `.openai/hosting.json`.

Do not silently choose irreversible or expensive providers. For early local
implementation, prefer provider-agnostic boundaries and document assumptions.
Twilio Verify is the operational SMS provider. Its service credentials, hosted
Supabase Phone-provider configuration, live SMS delivery, and six-digit OTP
verification were validated on 2026-07-29.

## 10. Recommended implementation sequence

Unless the user gives a different priority, continue in this order:

1. Create and configure Google and GitHub OAuth applications, then test new-user
   and returning-user routing through `/auth/confirm`.
2. Verify email confirmation, onboarding completion, profile editing, and
   password recovery end to end with a real development account; regenerate
   database types when the CLI environment supports it.
3. Add CAPTCHA and review Auth/SMS rate limits before exposing phone OTP to
   untrusted traffic.
4. Convert the notes-related landing-page claims into an explicit product, data, and permissions
   specification.
5. Implement note upload, browse, download, rating, soft deletion, and recovery.
6. Enforce university scoping and note permissions.
7. Implement indexed full-text search.
8. Implement permission-aware, source-grounded roadmap generation.
9. Implement realtime study rooms.
10. Add billing and moderation.

This sequence is guidance, not authorization to build all items at once. Implement
only the scope requested by the user.

## 11. Agent operating constraints

```yaml
invariants:
  - Keep the repository root at /Users/akruti/projects/classvault.
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
> project. Email/password works; Google and GitHub auth application flows are
> implemented but their external providers are not operational yet. Phone OTP
> is operational through hosted Supabase and Twilio Verify; live SMS delivery
> and six-digit OTP verification were confirmed working on 2026-07-29.
> Custom SMTP sender branding is deferred until the user owns a domain. The
> core notes, roadmap, and study-room product modules remain demonstrations.
> New work should preserve the design language, enforce access in RLS/server code,
> and avoid confusing demonstrations with implemented product capabilities.
