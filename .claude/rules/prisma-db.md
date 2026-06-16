---
paths:
  - "prisma/**/*"
  - "lib/server/db.ts"
  - "lib/server/**/*.ts"
  - "app/api/**/*.ts"
---

# Prisma / Database Rules

- Treat schema, migrations, auth, roles, rate limits, and storage metadata as high-risk.
- Do not edit generated Prisma output.
- Do not change migrations after they may have been applied unless explicitly requested.
- Keep route handlers thin; place reusable behavior in `lib/server/`.
- Run `pnpm prisma validate` for schema changes and focused tests for touched behavior.
- Any `schema.prisma` change MUST ship with a generated migration in the same
  change. Editing the schema (or generating the client) without a migration
  leaves the live DB missing columns/tables — code compiles but crashes at
  runtime (e.g. "column User.institutionId does not exist"). After editing the
  schema, run `pnpm exec prisma migrate dev --name <change> --create-only`,
  review the SQL, then apply.

## Full-text search migration drift (IMPORTANT)

`Note.searchVector` is a raw-SQL `tsvector` generated column with a GIN index
(`Note_searchVector_idx`), created in the `note_search_vector` migration. It is
typed `Unsupported("tsvector")?` and the index is NOT declarable in
`schema.prisma`.

Because of this, EVERY generated migration (`prisma migrate dev`) re-adds these
two WRONG lines:

```sql
DROP INDEX "Note_searchVector_idx";
ALTER TABLE "Note" ALTER COLUMN "searchVector" DROP DEFAULT;
```

Dropping that GIN index breaks/degrades full-text search. ALWAYS delete those
two lines from a freshly generated migration before applying — keep only the
intended additive DDL.
