# Security Rules

- Never print secrets, tokens, private keys, mnemonics, `.env` contents, or credentials.
- Do not add real secrets to files.
- Use `.env.example` or `.env.claude-context.example` for placeholders.
- Treat database URLs, JWT/session secrets, OAuth secrets, email provider keys, AWS keys, S3 URLs, and API keys as sensitive.
- Preserve auth, role checks, input validation, upload restrictions, and rate limits unless explicitly changing them.
