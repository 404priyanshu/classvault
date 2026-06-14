# Serena Usage

Serena is the project-local semantic navigation MCP for Claude Code.

Verify in Claude Code:
- Start Claude from this repo with `claude`.
- Run `/mcp`.
- Confirm `serena` is listed and connected.

Optional stronger start command:

```bash
claude --system-prompt="$(serena prompts print-cc-system-prompt-override)"
```

Use Serena for:
- Symbol lookup and definitions.
- Finding references and call relationships.
- Large refactors and cross-file edits.
- Understanding behavior before opening many files.

Do not bother with Serena for:
- Tiny text edits.
- README or simple config edits.
- One-file changes where the target is already obvious.

Safety:
- Do not auto-enable Serena auto-approve hooks by default.
- Review symbolic edits before accepting them.
- Keep `.claude/settings.serena-hooks.example.json` as an optional template only.
