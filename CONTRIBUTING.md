# Contributing

Thanks for helping improve ClassVault.

## Development Setup

ClassVault uses pnpm only.

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

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

## Code Guidelines

- Keep changes focused and easy to review.
- Prefer existing patterns over new abstractions.
- Keep route handlers thin; put reusable server logic in `lib/server/`.
- Preserve auth, role checks, rate limits, upload validation, and storage safety.
- Do not commit secrets, local databases, generated Prisma output, build output, or test reports.
- Add or update focused tests for behavior changes.

## Branches And Commits

- Branch from `main`.
- Use short, descriptive branch names, for example `fix/upload-validation`.
- Write commit messages in imperative mood, for example `Fix upload MIME validation`.

## Security Reports

Do not open public issues for vulnerabilities. See `SECURITY.md`.
