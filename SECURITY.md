# Security Policy

ClassVault handles user accounts, uploaded files, moderation state, and college verification. Please report vulnerabilities privately.

## Reporting A Vulnerability

Use GitHub's private vulnerability reporting for this repository when available. If that is not available, contact the repository owner privately and include:

- Affected route, component, or dependency.
- Reproduction steps or proof of concept.
- Expected security invariant.
- Impact and required preconditions.

Please do not publish exploit details until a fix is available.

## Security Expectations

- Authentication uses HTTP-only cookie sessions backed by the database.
- Authorization checks must stay server-side.
- Uploads must be validated by MIME type, size, owner, and storage key.
- College verification must be based on server-side OTP state, not browser storage.
- Abuse-sensitive endpoints should use DB-backed rate limits.

## Supported Versions

Security fixes target the latest `main` branch.
