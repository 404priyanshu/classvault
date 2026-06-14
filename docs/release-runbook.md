# ClassVault Campus Beta Runbook

## Production Stack

- Vercel hosts the Next.js app.
- Neon Postgres provides `DATABASE_URL`.
- AWS S3 stores uploaded files through presigned browser uploads.
- Google OAuth and email OTP handle student sign-up/sign-in.

## Required Environment

Set these in Vercel before the first preview deploy:

```bash
DATABASE_URL=
APP_ORIGIN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_PROVIDER=
AWS_SES_REGION=
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_OTP_SECRET=
ALLOWED_EMAIL_DOMAINS=
ADMIN_EMAILS=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_S3_BUCKET=
AWS_S3_PUBLIC_BASE_URL=
```

`AWS_SESSION_TOKEN` and `AWS_S3_PUBLIC_BASE_URL` are optional. If the public base URL is empty, ClassVault redirects downloads to short-lived signed S3 URLs. `EMAIL_OTP_SECRET` must be a long random string in production.

## Deployment Checklist

1. Create the Google OAuth web client and add `${APP_ORIGIN}/api/auth/google/callback`.
2. Create the Neon database and set the pooled connection string as `DATABASE_URL`.
3. Create the S3 bucket, IAM access policy, and CORS policy allowing browser `PUT` uploads from `APP_ORIGIN`.
4. Configure email OTP delivery (see **Email OTP (Resend)** below for the recommended path).
   - Resend (recommended): set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` to an address on a **verified domain**.
   - AWS SES (alternative): verify `EMAIL_FROM`, set `EMAIL_PROVIDER=ses`, set `AWS_SES_REGION`, attach an `ses:SendEmail` IAM policy, and request SES production access before inviting unverified recipients.
   - Always set a long random `EMAIL_OTP_SECRET` in production.
5. Set `ALLOWED_EMAIL_DOMAINS` to the campus domain list.
6. Set at least one `ADMIN_EMAILS` value before the first admin signs in.
7. Run release gates locally:

```bash
pnpm prisma validate
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

8. Deploy a Vercel preview.
9. Run database migrations against the preview database.
10. Open `/api/health/deep` on the preview and confirm the database check passes and S3 is reachable when configured.

## Email OTP (Resend)

The production deployment sends OTP through Resend from a verified subdomain of
`404priyanshu.dev`. Replicate as follows.

1. **Verify a sending subdomain, not a public mailbox.** Resend (and every
   reputable provider) refuses public mailboxes like `@gmail.com` — you can only
   send from a domain you verify. Add a subdomain such as `mail.<yourdomain>` at
   [resend.com/domains](https://resend.com/domains); a subdomain keeps sending
   reputation isolated from the apex used by any website.
2. **Add the DNS records** Resend shows (DKIM + SPF + a bounce MX) at your DNS
   host. Email records (TXT/MX on the subdomain) do not collide with a website's
   apex `A`/`CNAME` records. Wait for status `verified`.
3. **Set the Vercel env (Production):**
   ```bash
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_...
   EMAIL_FROM=ClassVault <noreply@mail.<yourdomain>>
   EMAIL_OTP_SECRET=<long random string>
   ```
   `EMAIL_FROM` must use the **verified subdomain**. The apex (`@<yourdomain>`)
   is a separate identity — sending from it returns `403 domain is not verified`.
4. **Redeploy** so functions pick up the env, then verify:
   ```bash
   curl -s -X POST https://<app>/api/auth/email/start \
     -H 'content-type: application/json' \
     -d '{"name":"Test","email":"someone@gmail.com"}'
   # expect {"ok":true,...}; 502 EMAIL_DELIVERY_FAILED means the sender/domain is wrong
   ```
   Confirm the verified domain and check sends directly with
   `curl https://api.resend.com/domains -H "Authorization: Bearer $RESEND_API_KEY"`.
5. Until a domain is verified, `onboarding@resend.dev` works for local testing
   but only delivers to the Resend account owner's own email.

**Deploy gotcha:** `vercel redeploy <url>` re-runs *that specific deployment's
source*. Targeting an old deployment rolls production back (e.g. to a build
missing newer routes). Always redeploy the newest `Ready` deployment, or push to
`main` to build from latest. Env changes only take effect after a redeploy.

## Preview Smoke Test

1. Open `/sign-in` and confirm password login, Google login, and email OTP sign-up are visible.
2. Start Google sign-in and confirm the request uses the production `client_id`, `redirect_uri`, `openid email profile` scope, and a `state` value.
3. Create an account with an allowed campus email OTP and confirm it lands on `/app`.
4. Sign in with an allowed campus Google account.
5. Upload a PDF/DOCX/PPTX/ZIP and confirm it appears as `PENDING` in the uploader profile.
6. Sign in as an admin, open Review, approve the upload, then confirm it appears in Library.
7. Click an approved PDF note and confirm the drawer shows an inline preview.
8. Upload another resource, reject it with a reason, and confirm the uploader sees the rejection reason.
9. Report a published note and confirm it appears in the Review report queue.
10. Hide a reported note and confirm it leaves public search.
11. Sign out and confirm the `classvault_session` cookie is cleared.

## Backup And Restore

- Neon: schedule daily logical backups before beta invites go out. Test restore into a staging branch before launch.
- S3: enable bucket versioning and lifecycle rules before beta invites go out.
- Keep database rows as source of truth for note metadata; S3 object keys are stored on `Note.storageKey` and `UploadedFile.storageKey`.
- To restore, recover Neon first, then restore/copy S3 objects. Run `/api/health/deep` and the preview smoke test afterward.

## Operational Notes

- Password login is for seeded/existing/admin fallback users. Student access should use Google or email OTP with `ALLOWED_EMAIL_DOMAINS`.
- `ADMIN_EMAILS` promotes matching users on sign-in; remove or narrow this list after initial bootstrap if desired.
- Moderators can approve, reject, hide, and restore notes. Assign moderator roles directly in the database for the beta.
- Rate limits are stored in the `RateLimit` table and can be cleared during incident response if needed.
