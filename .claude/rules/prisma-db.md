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
