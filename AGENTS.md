# CLASSVAULT — AI PROJECT CONTEXT

```yaml
document:
  purpose: Canonical repository handoff for coding agents
  context_version: 1
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
product_stage: Interactive landing-page prototype plus authentication foundation
production_application_status: Authenticated shell implemented; product modules not implemented
framework: Next.js 16.2.12
router: Next.js App Router
language: TypeScript
react: 19.2.0
styling: Tailwind CSS 3.4.19 plus global CSS
animation: Framer Motion
component_primitives: Radix UI / shadcn-style local components
package_manager: npm
canonical_lockfile: package-lock.json
git_repository: false
deployment_configured: false
environment_variables_required: true
authentication_provider: Supabase Auth
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
  - path: /auth/update-password
    type: authenticated password update page
  - path: /auth/confirm
    type: PKCE/OTP confirmation route handler
  - path: /dashboard
    type: protected authenticated application shell
```

The repository is already flattened into `/Users/akruti/projects/classvault`. There
must not be another top-level wrapper directory named `app`. The framework's
standard route directory, `src/app`, is intentional and must remain.

This codebase was migrated from a generated Vite/React prototype to Next.js. The
migration is complete. Do not repeat it.

Supabase integration code and the initial database migration are complete.
`.env.local` contains the hosted project URL and publishable key, and the hosted
Auth API was verified reachable on 2026-07-29. Migration
`20260729000000_create_profiles.sql` was applied to the hosted database on the
same date and a follow-up dry run reported the database up to date.

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
    implementation_status: Marketing concept only

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
- A protected `/dashboard` route using validated JWT claims.
- A typed `profiles` table migration with automatic Auth-user profile creation
  and owner-only row-level security.

### Simulated or absent

```yaml
not_implemented:
  - College-email verification
  - Authorization or university tenancy
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
  protected_route_without_session: pass
  hosted_supabase_auth_api: reachable
  hosted_database_migration: applied
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
2. There is no Git repository, so there is no commit history or Git-based
   rollback.
3. Some currently unused shadcn-style components may contain Tailwind syntax
   associated with newer Tailwind versions, including forms such as
   `origin-(--...)` or `outline-hidden`. The current landing page builds because
   these components are not materially used. Normalize and verify a component
   before introducing it into a user-facing route.
4. `npm audit --omit=dev` previously reported three high-severity advisories in
   Next.js transitive dependencies involving `postcss` and `sharp`. The suggested
   npm force remediation would downgrade Next.js to 9.3.3 and is not acceptable.
   Re-evaluate on future Next.js upgrades.
5. Do not run `npm audit fix --force`.
6. Marketing metrics, testimonials, ratings, user counts, and university counts
   are placeholder content and must not be treated as real analytics.
7. The checked-in database types match the current migration manually. The
   Supabase CLI type generator attempted to require Docker even with a remote
   connection URL on this machine. Regenerate with `npm run db:types` after CLI
   login, or after installing Docker for a local stack.

## 9. Undecided product and infrastructure choices

No decision has been made for any of the following:

```yaml
open_decisions:
  - College-email verification mechanism
  - Authorization and multi-tenant university boundaries
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

## 10. Recommended implementation sequence

Unless the user gives a different priority, continue in this order:

1. Verify the complete email-confirmation, profile-trigger, and password-recovery
   flows with a real development account; regenerate database types when the CLI
   environment supports it.
2. Convert landing-page claims into an explicit product, data, and permissions
   specification.
3. Design and implement verified college-email membership.
4. Implement note upload, browse, download, rating, soft deletion, and recovery.
5. Enforce university scoping and note permissions.
6. Implement indexed full-text search.
7. Implement permission-aware, source-grounded roadmap generation.
8. Implement realtime study rooms.
9. Add billing and moderation.

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

> ClassVault currently has a visually complete Next.js landing-page prototype and
> a Supabase-backed authentication foundation with a protected dashboard and
> an applied owner-scoped profile migration. Hosted app credentials and the
> initial database are configured; live account-flow testing is still pending.
> The core product modules remain demonstrations.
> New work should preserve the design language, enforce access in RLS/server code,
> and avoid confusing demonstrations with implemented product capabilities.
