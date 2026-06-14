---
name: repomix-pack
description: Create selected context packs safely with Repomix.
---

# Repomix Pack

Use when a selected code bundle is more useful than symbolic search.

Rules:
- Never pack the full repo by default.
- Prefer selected files from `git ls-files`, `rg --files`, or explicit paths.
- Include diffs only when useful for the task.
- Avoid secrets, `.env*`, generated folders, build output, uploads, and `.claude/context/`.
- Use compression when possible.

Recommended command:

```bash
bash scripts/repomix-selected.sh <glob-or-path> [...]
```

Summarize what was packed and where the output was written.
