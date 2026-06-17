# Contributing To ClassVault

Thanks for helping make ClassVault better for students.

## Ground Rules

- Keep changes focused and easy to review.
- Prefer existing project patterns over new abstractions.
- Preserve auth, role checks, rate limits, upload validation, moderation, and storage safety.
- Do not commit secrets, local DB files, generated Prisma output, build output, package-manager stores, or test reports.
- Add or update focused tests for behavior changes.

## Development Setup

ClassVault uses pnpm only. Install with pnpm, not npm or yarn.

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local app |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run Vitest |
| `pnpm test:e2e` | Run Playwright specs |
| `pnpm prisma validate` | Validate Prisma schema |
| `pnpm build` | Production build |

## Before Opening A Pull Request

Run the relevant focused checks while developing, then run the full release gate before asking for review:

```bash
pnpm prisma validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run `pnpm test:e2e` for browser-facing changes.

## Pull Request Checklist

- Describe the problem and the fix.
- Link the issue when one exists.
- Include screenshots for visible UI changes.
- Mention tests run.
- Call out migrations, env vars, or deployment steps.

## Code Review

Pull requests get an automated [Amazon Q Developer](https://aws.amazon.com/q/developer/)
review in addition to maintainer review. Treat its comments as advisory: address
real findings, but the maintainer still approves and merges. Comment `/q review`
on a PR to trigger a fresh pass.

## Code Guidelines

- Keep route handlers thin; put reusable server logic in `lib/server/`.
- Use Zod for request validation.
- Keep server-only secrets out of client components and `NEXT_PUBLIC_*`.
- Reuse existing auth helpers, role checks, storage helpers, and rate-limit helpers.
- Keep Prisma schema changes in migrations and update tests/seeds when needed.

## Branches And Commits

- Branch from `main`.
- Use short, descriptive branch names, for example `fix/upload-validation`.
- Write commit messages in imperative mood, for example `Fix upload MIME validation`.

## Files That Should Stay Out Of Git

These are local/generated artifacts and should remain ignored:

- `.env*` except `.env.example`
- `.next/`
- `.pnpm-store/`
- `.vercel/`
- `coverage/`
- `test-results/`
- `playwright-report/`
- `lib/generated/`
- `prisma/dev.db*`
- `var/`

## Security Reports

Do not open public issues for vulnerabilities. See `SECURITY.md`.
