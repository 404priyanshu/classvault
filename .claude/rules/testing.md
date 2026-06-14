---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "tests/**/*"
---

# Testing Rules

- Add or update focused tests for behavior changes.
- Do not rewrite unrelated tests.
- Prefer narrow test commands before full-suite runs.
- Keep test fixtures explicit and small.
- Preserve Playwright's local dev-server flow.
