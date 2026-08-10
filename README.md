# ClassVault

ClassVault is a study platform concept for Indian college students. The repository
contains an interactive product landing page plus the initial authenticated
application foundation: Supabase email/password auth, application flows for
Google, GitHub, and phone OTP authentication, a protected three-step student
onboarding flow, verified-or-pending university membership, and a protected
dashboard.

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
```

Use the project URL and publishable key from the Supabase project's Connect
dialog. A service-role key is not required and must not be exposed to the
browser.

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

After sign-up and email confirmation, users are sent through `/onboarding`.
Completed profiles enter `/dashboard` and can be edited at
`/onboarding?edit=1`.

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
and future roadmap authorization is
[`docs/notes-product-data-permissions-spec.md`](docs/notes-product-data-permissions-spec.md).
The hosted schema/RLS foundation is implemented through migrations
`20260810000000_create_notes_foundation.sql` and
`20260810010000_harden_notes_function_privileges.sql`, with 38 transactional
pgTAP tests in `supabase/tests/notes_rls.sql`. Note storage and product routes
are not yet implemented.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
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
- `src/components/onboarding` — responsive onboarding experience
- `src/sections` — landing-page sections and interactive demonstrations
- `src/components/ui` — reusable shadcn/Radix UI primitives
- `src/lib/supabase` — typed browser/server clients and session utilities
- `src/assets` — local ClassVault illustrations and textures
- `docs/notes-product-data-permissions-spec.md` — notes product, data model,
  permissions, lifecycle, and acceptance criteria
- `supabase` — local config, branded auth email templates, seed file, and
  versioned database migrations
