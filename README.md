# ClassVault

A shared library of notes, previous-year questions, and study resources for your class. Browse, save, rate, and upload — without digging through group chats.

Frontend prototype built with Next.js (App Router), React, Tailwind CSS v4, and Geist. All data is currently static in `lib/classvault-data.ts`; see `docs/backend-build-guide.md` for the backend plan.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — landing page (`components/class-vault-landing.tsx`)
- `/app` — the app: dashboard, library, saved, uploads, profile (`components/class-vault-app.tsx`)

## Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `pnpm dev`   | Start dev server         |
| `pnpm build` | Production build         |
| `pnpm start` | Serve production build   |
| `pnpm lint`  | Run ESLint               |
