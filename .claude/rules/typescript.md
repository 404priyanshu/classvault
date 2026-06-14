---
paths:
  - "**/*.{ts,tsx,js,jsx}"
  - "next.config.ts"
  - "vitest.config.ts"
  - "playwright.config.ts"
---

# TypeScript / JavaScript Rules

- Prefer existing patterns and local helpers before adding abstractions.
- Keep types explicit at route, API, database, and component boundaries.
- Do not introduce dependencies without a concrete reason.
- Preserve strict TypeScript assumptions and the `@/*` import alias.
- Run the detected lint/test/build command when relevant.
