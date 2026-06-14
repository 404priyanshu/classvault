# Claude Code Operating Rules

## 1. Project Snapshot

ClassVault is a Next.js App Router app for sharing class notes, PYQs, uploads, reports, and staff moderation.

Stack inferred from the repo:
- Package manager: pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`; CI uses pnpm 11).
- Runtime/framework: Next.js 16, React 19, TypeScript strict mode, Tailwind CSS 4.
- Backend: Next.js route handlers in `app/api`, Prisma 7 with Postgres, custom cookie sessions, Zod validation.
- Tests: Vitest for `tests/**/*.test.ts`; Playwright for `tests/e2e`.
- Tooling: ESLint 9, Prisma migrations/seed, Vercel-oriented deploy notes.

Important directories:
- `app/`: routes, pages, layouts, and API handlers.
- `components/`: landing and app UI.
- `lib/server/`: auth, DB, notes, validation, storage, email, rate limits.
- `lib/`: shared types/data/format helpers.
- `prisma/`: schema, migrations, and seed.
- `tests/`: unit/integration tests and Playwright e2e specs.
- `docs/`: project build notes.

Never pack or blindly read noisy/generated directories:
- `node_modules/`, `.next/`, `.git/`, `.codegraph/`, `.serena/`, `.pnpm-store/`, `.vercel/`
- `coverage/`, `test-results/`, `playwright-report/`, `tsconfig.tsbuildinfo`
- `lib/generated/`, `lib/generated/prisma/`, `var/`, `.claude/context/`, `.claude/backups/`

## 2. Non-Negotiable Behavior

- Think before coding. State assumptions when the request is ambiguous.
- Choose the simplest working solution that matches existing patterns.
- Make surgical changes only. Do not refactor unrelated code.
- Do not add speculative features, dependencies, services, or abstractions.
- Do not hide uncertainty. Say what was verified and what was not.
- Do not read huge files or generated folders blindly.
- Do not dump long logs into chat. Summarize and keep the useful lines.
- Prefer CodeGraph or Serena symbolic search before brute-force file reads.
- Read exact target files before editing them.
- Verify with focused checks after edits.

## 3. Token Discipline

- Use `/context` when context feels high or before a risky handoff.
- Use `/compact` with a clear focus before long sessions continue.
- Use `/clear` between unrelated tasks.
- Summarize large outputs instead of pasting them.
- Inspect directory/file lists before opening files.
- Use Serena symbolic tools when available for symbol lookup, references, and cross-file edits.
- Use Repomix only for selected packs or audits, never default whole-repo dumps.
- Prefer `bash scripts/claude-token-audit.sh` before broad context packing.

## 4. Development Workflow

1. Explore: use CodeGraph/Serena, then targeted file reads.
2. Plan: list likely files to change, expected behavior, and checks.
3. Edit: keep changes small and local.
4. Verify: run the narrowest relevant command first.
5. Summarize: changed files, checks run, residual risks.

Before edits, list files likely to change. After edits, list changed files, tests/checks run, and risks.

## 5. Commands

Setup:
- `pnpm install`
- `cp .env.example .env`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm dev`

Verification:
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm prisma validate`
- `pnpm prisma generate`

Database:
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:studio`

Claude workflow helpers:
- `pnpm claude:doctor`
- `pnpm claude:tokens`
- `pnpm claude:pack -- <glob-or-path> [...]`

No dedicated `typecheck` script was detected. Verify before running ad hoc TypeScript commands.
