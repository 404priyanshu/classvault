#!/usr/bin/env bash
set -u

ok() { printf "ok     %s\n" "$1"; }
warn() { printf "missing %s\n" "$1"; }
cmd_path() {
  if command -v "$1" >/dev/null 2>&1; then
    command -v "$1"
  elif [ -x "$HOME/.local/bin/$1" ]; then
    printf "%s/.local/bin/%s\n" "$HOME" "$1"
  fi
}

echo "# Claude Workflow Doctor"
echo

if command -v claude >/dev/null 2>&1; then
  ok "claude: $(command -v claude)"
else
  warn "claude"
  echo "  next: pnpm add -g @anthropic-ai/claude-code"
fi

if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm: $(command -v pnpm)"
else
  warn "pnpm"
  echo "  next: corepack enable && corepack prepare pnpm@11.0.0 --activate"
fi

UV_BIN="$(cmd_path uv || true)"
if [ -n "$UV_BIN" ]; then
  ok "uv: $UV_BIN"
  if ! command -v uv >/dev/null 2>&1; then
    echo "  note: add $HOME/.local/bin to PATH for plain 'uv'"
  fi
else
  warn "uv"
  echo "  next: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

SERENA_BIN="$(cmd_path serena || true)"
if [ -n "$SERENA_BIN" ]; then
  ok "serena: $SERENA_BIN"
  if ! command -v serena >/dev/null 2>&1; then
    echo "  note: add $HOME/.local/bin to PATH for plain 'serena'"
  fi
  "$SERENA_BIN" --version 2>/dev/null || true
else
  warn "serena"
  echo "  next: uv tool install -p 3.13 serena-agent"
  echo "  next: serena init"
fi

echo
echo "## Repomix"
if command -v pnpm >/dev/null 2>&1; then
  pnpm dlx repomix@latest --version || true
else
  echo "pnpm missing; cannot check Repomix."
fi

echo
echo "## Claude MCP"
if command -v claude >/dev/null 2>&1; then
  MCP_LIST="$(claude mcp list 2>/dev/null || true)"
  if printf "%s\n" "$MCP_LIST" | grep -qi "serena"; then
    ok "Serena MCP appears in claude mcp list"
  else
    warn "Serena MCP not listed"
    if [ -n "${SERENA_BIN:-}" ]; then
      echo "  next: claude mcp add --scope local serena -- $SERENA_BIN start-mcp-server --context claude-code --project \"$(pwd)\""
    else
      echo "  next: claude mcp add --scope local serena -- serena start-mcp-server --context claude-code --project \"$(pwd)\""
    fi
  fi
else
  echo "claude missing; skipping MCP list."
fi

echo
echo "## Optional Claude Context"
for var in OPENAI_API_KEY MILVUS_ADDRESS MILVUS_TOKEN; do
  if [ -n "${!var:-}" ]; then
    ok "$var present"
  else
    warn "$var"
  fi
done
