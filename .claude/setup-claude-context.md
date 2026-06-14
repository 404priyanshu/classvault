# Optional Claude Context / Zilliz Setup

Claude Context was not installed because the required environment variables were not all present:

- `OPENAI_API_KEY`
- `MILVUS_ADDRESS`
- `MILVUS_TOKEN`

This is optional. Do not install it unless you want cloud-backed semantic context and have reviewed the data/security implications.

When the variables are available, add the MCP server from this repo:

```bash
claude mcp add claude-context \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e MILVUS_ADDRESS="$MILVUS_ADDRESS" \
  -e MILVUS_TOKEN="$MILVUS_TOKEN" \
  -- pnpm dlx @zilliz/claude-context-mcp@latest
```

Keep real secrets out of committed files. Use `.env.claude-context` locally if needed.
