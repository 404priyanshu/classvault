# ClassVault dark landing-page prototype

This is a standalone static prototype. It does not import, register, or modify any production ClassVault route or component.

## Run locally

From the repository root:

```bash
cd prototypes/classvault-dark-landing
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Files

- `index.html` — semantic page structure and product previews
- `styles.css` — standalone design system and responsive layout
- `script.js` — local-only demo interactions

Sign-in and sign-up actions are local prototype interactions only. They intentionally do not attach this page to the production Next.js application.
