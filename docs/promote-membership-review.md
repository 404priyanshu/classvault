# Promoting the membership review migration to production

Prepared 2026-09-22 against production `hndgstbutlkjqnrxvqtm`. Everything below is
verified, not assumed — each claim names how it was checked.

## What will run

```
20260922000000_create_membership_review.sql
20260922010000_grant_service_role_table_privileges.sql
```

`supabase db push --dry-run --linked` confirms these two and nothing else.
`supabase migration list --linked` shows all 32 earlier migrations as
`local == remote`, which is what the Stage 1 version rename was for.

## Risk assessment

**`20260922010000` is a no-op on production.** Verified by querying production:

- all 72 public functions already grant `service_role` EXECUTE (0 without),
- every public table already carries `service_role=arwdDxtm`,
- the `postgres`-granted default ACLs in `public` already include
  `service_role=arwdDxtm` for tables and `rwU` for sequences.

It exists so a database rebuilt anywhere else matches. It changes nothing here.

**`20260922000000` touches one live code path.** It renames
`complete_student_onboarding` to `complete_student_onboarding_initial`, revokes
it from client roles, and creates a new `complete_student_onboarding` with the
**same signature** that refuses a second call. The deployed app keeps working:
`src/app/onboarding/actions.ts` is the only caller in `src/`, it is the first-run
flow, and `/onboarding` already redirects completed users away. Settings edits
profiles through different RPCs, so profile editing is unaffected.

The rest is additive: a new forced-RLS table, its indexes, and five new functions.

**The deployed route is already live and broken until this runs.** `main` carries
`/dashboard/verification`, so a pending student who opens it now gets an error
from RPCs that do not exist. This closes that gap rather than opening one.

## Sequence

The CLI is already linked to production and authenticated.

```bash
npm run db:push:production
```

That is the only script that writes to production; it requires the production ref
to be linked and sets `ALLOW_PRODUCTION_DB_WRITE=1` itself. `npm run db:push`
refuses, as does `npm run db:test:hosted` — both were confirmed to refuse while
linked to production.

Then confirm:

```bash
npm run db:status          # both versions should show local == remote
```

## After the push: appoint a reviewer

No reviewer exists in production, so the queue has nobody to work it. A reviewer
needs **either** a row in `platform_roles` with `platform_moderator` or
`platform_admin`, **or** `role = 'moderator' | 'admin'` on a verified
`university_memberships` row for Bennett. Both are server-owned; the request form
grants neither.

`platform_roles` has a `granted_by <> user_id` check, so the first platform-level
reviewer cannot appoint themselves — the campus-membership route is the simpler
first step:

```sql
update public.university_memberships m
set role = 'moderator'
from auth.users u
where u.id = m.user_id
  and u.email = '<the reviewer>'
  and m.status = 'verified';
```

Run it against production deliberately, for a real person who will do the
checking. `docs/membership-review.md` defines what that checking must involve:
an independent trusted roster or a known campus staff contact. A student ID typed
into the form is a claim, not evidence.

## Rollback

There is no down migration. The additive parts are droppable; the onboarding
rename is the part to think about, and reversing it is:

```sql
drop function if exists public.complete_student_onboarding(text, text, smallint, bigint, text, text);
alter function public.complete_student_onboarding_initial(text, text, smallint, bigint, text, text)
  rename to complete_student_onboarding;
grant execute on function public.complete_student_onboarding(text, text, smallint, bigint, text, text)
  to authenticated;
```

That restores the previous behaviour, including the re-onboarding hole it closed.
Prefer rolling forward unless onboarding is actually broken.

## Verification available before this runs

All 334 pgTAP assertions across 12 suites pass against a local stack carrying
exactly these migrations, including the assertion covering the re-onboarding
guard — which had never executed before 2026-09-22 because there was no database
to run it against. The reviewer workflow was driven end to end through the UI
there: submit, queue, approve, membership flip, audit trail.

None of that is a substitute for the push being a deliberate, watched act.
