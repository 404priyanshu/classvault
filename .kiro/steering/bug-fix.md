---
inclusion: manual
---

# Bug Fix Workflow

This guide defines the standard process for diagnosing and fixing bugs in ClassVault.

## 1. Reproduce First

Before touching any code:

- Identify the exact request/input that triggers the bug
- Confirm which environment it occurs in (dev, prod, both)
- Note the exact error — message, stack trace, HTTP status, or wrong output
- Check `/api/health/deep` if the issue might be DB or S3 connectivity

## 2. Locate the Failure Point

Use this layered search order:

1. **API route handler** — `app/api/**` — does it reach the right handler? Check method and path.
2. **Validation** — `lib/server/validation.ts` — is the input being rejected by Zod before the logic runs?
3. **Auth / rate limit** — `lib/server/auth.ts`, `lib/server/rate-limit.ts` — is the request being blocked upstream?
4. **Business logic** — `lib/server/` (notes, moderation, collections, comments, etc.) — is the core logic wrong?
5. **DB query** — is the Prisma query filtering, ordering, or joining incorrectly?
6. **Storage / AI** — `lib/server/storage.ts`, `lib/server/ai.ts` — external I/O issues

## 3. Understand Before Fixing

- Read the affected file(s) fully before making any change
- Identify whether the bug is a logic error, a missing guard, a wrong assumption, or a data issue
- Check if the same pattern is repeated elsewhere (and needs fixing in multiple places)
- Look for related tests in `tests/` — if a test covers this path, understand why it didn't catch the bug

## 4. Fix Guidelines

### Auth & Sessions
- Session tokens are SHA-256 hashed before DB storage — never compare raw tokens
- `getCurrentUser()` returns `null` for expired/missing sessions — always check
- Role checks use `requireRole(...roles)` — do not inline role comparisons in routes
- `ADMIN_EMAILS` bootstrap happens on every `getCurrentUser()` call via `applyUserBootstrap`

### Rate Limits
- Rate limit keys follow `scope:user:id`, `scope:ip:address`, or `scope:inst:id:userId`
- The `assertRateLimit` call is a single atomic UPSERT — do not add pre-checks around it
- `RateLimitError` carries `retryAfterSeconds` — surface it in the `Retry-After` response header

### Notes & Uploads
- New notes are created with `status: "PENDING"` — they never appear in public lists until approved
- `storageKey` on a note must match a row in `UploadedFile` — validated at creation time
- `ratingAverage` and `ratingCount` are cached aggregates — updated inside a transaction via `computeRatingAggregate`
- Download count is an event table + cached counter — both must be incremented together

### Moderation
- All moderation actions go through `moderateNote()` in `lib/server/moderation.ts`
- Every action writes a `ModerationEvent` row — do not skip this audit trail
- `APPROVE` and `REJECT` trigger `Notification` fan-out to the uploader (unless self-moderation)

### AI
- `generateJsonWithAi()` tries Gemini first, OpenAI second — errors from both are collected and joined
- Always validate AI responses with the corresponding Zod schema after generation
- `AiConfigurationError` means no API keys are set — return a clear 503, not a 500
- `AiProviderError` is a provider-side failure — return 502

### Collections & Comments
- Collection slugs are unique — slug collisions must be handled gracefully on creation
- Comments support one level of replies — `parentId` must point to a top-level comment only
- Deleted comments show a placeholder body, never the original content

### Storage
- `resolveSafe()` path-traversal guard in `storage.ts` — never bypass it
- Local storage root is `var/storage/` (gitignored) — S3 is used when `AWS_S3_BUCKET` is set
- Presigned upload URLs expire in 10 minutes; download URLs expire in 5 minutes

## 5. Error Response Conventions

Use `lib/server/http.ts` helpers for consistent error shapes:

```ts
// Standard error shape: { error: { code: string; message: string } }
return apiError(400, "VALIDATION_ERROR", "Descriptive message");
return apiError(401, "UNAUTHORIZED", "Not signed in.");
return apiError(403, "FORBIDDEN", "You do not have access.");
return apiError(404, "NOT_FOUND", "Resource not found.");
return apiError(429, "RATE_LIMITED", "Too many requests.", { retryAfter });
return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
```

Never return raw error messages that expose stack traces or internal details.

## 6. Verify the Fix

Before marking a bug as fixed, run:

```bash
pnpm typecheck          # catch type regressions
pnpm lint               # catch lint issues
pnpm test               # run all Vitest unit tests
pnpm test:e2e           # run Playwright e2e if UI or auth flow affected
pnpm build              # confirm no build-time errors
```

For auth, storage, or AI changes, also manually verify:
- The fixed scenario works end-to-end in `pnpm dev`
- Adjacent flows are not broken (e.g. fixing sign-in doesn't break sign-out)
- `/api/health/deep` still passes if DB or S3 was touched

## 7. Test Coverage

If the bug was not caught by an existing test, add one:

- Pure logic bugs → add a unit test in `tests/*.test.ts`
- API or auth flow bugs → add or extend a Playwright spec in `tests/e2e/`
- Rate limit or validation bugs → add a Vitest case against the Zod schema or `assertRateLimit`

Keep tests focused: one test per behavior, not per line of code.
