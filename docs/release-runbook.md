# ClassVault Campus Beta Runbook

## Production Stack

- Vercel hosts the Next.js app.
- Neon Postgres provides `DATABASE_URL`.
- AWS S3 stores uploaded files through presigned browser uploads.
- Google OAuth is the primary student sign-in path.

## Required Environment

Set these in Vercel before the first preview deploy:

```bash
DATABASE_URL=
APP_ORIGIN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_EMAIL_DOMAINS=
ADMIN_EMAILS=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_S3_BUCKET=
AWS_S3_PUBLIC_BASE_URL=
```

`AWS_SESSION_TOKEN` and `AWS_S3_PUBLIC_BASE_URL` are optional. If the public base URL is empty, ClassVault redirects downloads to short-lived signed S3 URLs.

## Deployment Checklist

1. Create the Google OAuth web client and add `${APP_ORIGIN}/api/auth/google/callback`.
2. Create the Neon database and set the pooled connection string as `DATABASE_URL`.
3. Create the S3 bucket, IAM access policy, and CORS policy allowing browser `PUT` uploads from `APP_ORIGIN`.
4. Set `ALLOWED_EMAIL_DOMAINS` to the campus domain list.
5. Set at least one `ADMIN_EMAILS` value before the first admin signs in.
6. Run release gates locally:

```bash
pnpm prisma validate
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

7. Deploy a Vercel preview.
8. Run database migrations against the preview database.
9. Open `/api/health/deep` on the preview and confirm the database check passes and S3 is reachable when configured.

## Preview Smoke Test

1. Open `/sign-in` and confirm password login and Google login are visible.
2. Start Google sign-in and confirm the request uses the production `client_id`, `redirect_uri`, `openid email profile` scope, and a `state` value.
3. Sign in with an allowed campus Google account.
4. Upload a PDF/DOCX/PPTX/ZIP and confirm it appears as `PENDING` in the uploader profile.
5. Sign in as an admin, open Review, approve the upload, then confirm it appears in Library.
6. Click an approved PDF note and confirm the drawer shows an inline preview.
7. Upload another resource, reject it with a reason, and confirm the uploader sees the rejection reason.
8. Report a published note and confirm it appears in the Review report queue.
9. Hide a reported note and confirm it leaves public search.
10. Sign out and confirm the `classvault_session` cookie is cleared.

## Backup And Restore

- Neon: schedule daily logical backups before beta invites go out. Test restore into a staging branch before launch.
- S3: enable bucket versioning and lifecycle rules before beta invites go out.
- Keep database rows as source of truth for note metadata; S3 object keys are stored on `Note.storageKey` and `UploadedFile.storageKey`.
- To restore, recover Neon first, then restore/copy S3 objects. Run `/api/health/deep` and the preview smoke test afterward.

## Operational Notes

- Password login is for seeded/existing/admin fallback users. Student access should use Google with `ALLOWED_EMAIL_DOMAINS`.
- `ADMIN_EMAILS` promotes matching users on sign-in; remove or narrow this list after initial bootstrap if desired.
- Moderators can approve, reject, hide, and restore notes. Assign moderator roles directly in the database for the beta.
- Rate limits are stored in the `RateLimit` table and can be cleared during incident response if needed.
