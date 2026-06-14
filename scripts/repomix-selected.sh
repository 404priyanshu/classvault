#!/usr/bin/env bash
set -u

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/repomix-selected.sh <glob-or-path> [...]" >&2
  echo "Refusing to pack the whole repo by default." >&2
  exit 2
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required to run Repomix." >&2
  exit 1
fi

mkdir -p .claude/context
TMP_FILES="$(mktemp)"
trap 'rm -f "$TMP_FILES"' EXIT

collect_path() {
  arg="$1"

  if [ -f "$arg" ]; then
    printf "%s\n" "$arg"
    return
  fi

  if [ -d "$arg" ]; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      git ls-files "$arg"
    elif command -v rg >/dev/null 2>&1; then
      rg --files "$arg"
    else
      find "$arg" -type f
    fi
    return
  fi

  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git ls-files ":(glob)$arg" 2>/dev/null || true
  elif command -v rg >/dev/null 2>&1; then
    rg --files -g "$arg"
  else
    find . -path "./$arg" -type f 2>/dev/null
  fi
}

for arg in "$@"; do
  collect_path "$arg"
done \
  | grep -Ev '(^|/)(node_modules|\.git|\.next|out|coverage|\.turbo|\.cache|vendor|target|artifacts|cache|typechain-types|broadcast|\.venv|venv|__pycache__|\.pnpm-store|\.vercel|\.codegraph|\.serena|test-results|playwright-report|lib/generated|var|\.claude/context|\.claude/backups)(/|$)' \
  | grep -Ev '(^|/)\.env($|\.)|(^|/).*\.pem$|(^|/)(id_rsa|id_ed25519)(\.pub)?$' \
  | sort -u > "$TMP_FILES"

if [ ! -s "$TMP_FILES" ]; then
  echo "No safe files matched. Refusing to create an empty context pack." >&2
  exit 1
fi

echo "Warning: review selected files before sharing. Secrets and noisy paths are filtered, but humans own final review." >&2
echo "Packing $(wc -l < "$TMP_FILES" | tr -d " ") selected files into .claude/context/selected-context.xml" >&2

pnpm dlx repomix@latest --stdin --compress -o .claude/context/selected-context.xml < "$TMP_FILES"
