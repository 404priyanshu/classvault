---
name: token-audit
description: Audit likely context waste and recommend safe ignore/packing choices for this repo.
---

# Token Audit

Use when context feels high, before broad codebase packing, or before a long refactor.

Steps:
1. Inspect tracked file counts and top-level sizes without reading generated folders.
2. Identify huge or noisy paths such as `node_modules/`, `.next/`, `.git/`, `.codegraph/`, generated Prisma output, uploads, test artifacts, and `.claude/context/`.
3. Run `bash scripts/claude-token-audit.sh` when available.
4. If Repomix is available, use token-count tree output for selected audit guidance only.
5. Recommend paths to ignore, paths worth targeted reading, and whether Serena/CodeGraph symbolic search should be used before file reads.

Output:
- Largest context risks.
- Safe ignore additions, if any.
- Best next navigation method: CodeGraph, Serena, targeted `rg`, or selected Repomix pack.
