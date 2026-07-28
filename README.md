# ClassVault

ClassVault is a study platform concept for Indian college students. The repository
contains an interactive product landing page plus the initial authenticated
application foundation: Supabase email/password auth, a protected three-step
student onboarding flow, verified-or-pending university membership, and a
protected dashboard.

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

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Structure

- `src/app` — Next.js layout, page, metadata, and global styles
- `src/app/auth` — sign-up, sign-in, confirmation, and password-recovery flows
- `src/app/onboarding` — protected onboarding route and completion server action
- `src/app/dashboard` — authenticated application entry point
- `src/components/onboarding` — responsive onboarding experience
- `src/sections` — landing-page sections and interactive demonstrations
- `src/components/ui` — reusable shadcn/Radix UI primitives
- `src/lib/supabase` — typed browser/server clients and session utilities
- `src/assets` — local ClassVault illustrations and textures
- `supabase` — local config, seed file, and versioned database migrations
