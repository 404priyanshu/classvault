# AGENTS.md

## Repo Overview

ClassVault is a pnpm-managed Next.js App Router app with React 19, TypeScript strict mode, Prisma/Postgres, Zod validation, custom cookie auth, upload moderation, Vitest tests, and Playwright e2e specs.

Important paths:
- `app/`: pages, layouts, and API route handlers.
- `components/`: landing and application UI.
- `lib/server/`: auth, DB, notes, storage, email, moderation, validation, rate limits.
- `prisma/`: schema, migrations, seed.
- `tests/`: Vitest and Playwright tests.

Avoid reading or packing `node_modules/`, `.next/`, `.git/`, `.codegraph/`, `.serena/`, `.pnpm-store/`, `.vercel/`, `coverage/`, `test-results/`, `playwright-report/`, `lib/generated/`, `var/`, `.claude/context/`, and `.claude/backups/`.

## Setup And Commands

- Install: `pnpm install`
- Local env: `cp .env.example .env`
- Database: `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Tests: `pnpm test`, `pnpm test:e2e`
- Build: `pnpm build`
- Prisma checks: `pnpm prisma validate`, `pnpm prisma generate`
- Claude helpers: `pnpm claude:doctor`, `pnpm claude:tokens`, `pnpm claude:pack -- <glob-or-path> [...]`

## Agent Workflow

Use CodeGraph first for repo exploration.

Start with `codegraph_status` when tracing architecture, finding files, or understanding flows. Use `codegraph_files`, `codegraph_search`, `codegraph_explore`, `codegraph_callers`, `codegraph_callees`, and `codegraph_impact` before broad filesystem exploration.

Avoid broad `grep`, `find`, `ls`, `cat`, or random file reads unless CodeGraph is insufficient. Prefer `rg`/`rg --files` for targeted filesystem checks. In Codex CLI environments with `rtk`, prefix shell commands with `rtk`.

Use RTF before editing: read exact target files after CodeGraph identifies them. Do not edit based only on search results or assumptions.

Before modifying code, state:
1. relevant files found
2. planned change
3. checks to run

## Coding Rules

- Think first; state assumptions when ambiguous.
- Prefer the simplest working solution and existing project patterns.
- Make surgical edits only. Do not refactor unrelated code.
- Do not add speculative features, services, dependencies, or abstractions.
- Preserve auth, role checks, rate limits, upload validation, and storage safety.
- Keep route handlers thin; prefer business logic in `lib/server/`.
- Never print secrets or read `.env` contents.

## Token Discipline

- Prefer CodeGraph or Serena symbolic tools before broad reads.
- Summarize long logs instead of pasting them.
- Use Repomix only for selected packs/audits.
- Use `.claude/skills/token-audit` or `bash scripts/claude-token-audit.sh` before large context work.
- Compact or hand off with current goal, changed files, commands run, errors, risks, and next exact steps.

## Verification Expectations

Run the narrowest relevant check after edits:
- UI/API logic: `pnpm lint` and focused `pnpm test` where applicable.
- Prisma/schema work: `pnpm prisma validate` and relevant migration/seed checks.
- E2E-sensitive flows: `pnpm test:e2e` when browser behavior changes.
- Release-level changes: `pnpm lint`, `pnpm test`, `pnpm build`.

Keep responses concise and technically complete. For large explanations, summarize first, then provide details only when asked.
