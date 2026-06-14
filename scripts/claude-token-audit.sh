#!/usr/bin/env bash
set -u

OUT=".claude/context/token-audit.txt"
mkdir -p "$(dirname "$OUT")"

{
  echo "# Claude Token Audit"
  date
  echo

  echo "## Repository file counts"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    printf "Tracked files: "
    git ls-files | wc -l | tr -d " "
    echo
  fi
  if command -v rg >/dev/null 2>&1; then
    printf "Visible rg files: "
    rg --files | wc -l | tr -d " "
    echo
  fi
  echo

  echo "## Top-level size risks"
  du -sh .[!.]* * 2>/dev/null | sort -hr | sed -n "1,30p" || true
  echo

  echo "## Largest tracked files"
  noisy_re='(^|/)(node_modules|\.git|\.next|out|coverage|\.turbo|\.cache|vendor|target|artifacts|cache|typechain-types|broadcast|\.venv|venv|__pycache__|\.pnpm-store|\.vercel|\.codegraph|\.serena|test-results|playwright-report|lib/generated|var|\.claude/context|\.claude/backups)(/|$)'
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git ls-files \
      | grep -Ev "$noisy_re" \
      | while IFS= read -r file; do [ -f "$file" ] && du -h "$file"; done \
      | sort -hr \
      | sed -n "1,40p" || true
  elif command -v rg >/dev/null 2>&1; then
    rg --files \
      | grep -Ev "$noisy_re" \
      | while IFS= read -r file; do [ -f "$file" ] && du -h "$file"; done \
      | sort -hr \
      | sed -n "1,40p" || true
  fi
  echo

  echo "## Recommended default excludes"
  cat <<'EXCLUDES'
node_modules/
.next/
.git/
.codegraph/
.serena/
.pnpm-store/
.vercel/
coverage/
test-results/
playwright-report/
lib/generated/
var/
.claude/context/
.claude/backups/
EXCLUDES
  echo

  echo "## Repomix token-count tree"
  if command -v pnpm >/dev/null 2>&1; then
    pnpm dlx repomix@latest --token-count-tree 1000 || true
  else
    echo "pnpm not found; skipping Repomix token-count tree."
  fi
} 2>&1 | tee "$OUT"

echo
echo "Saved audit to $OUT"
