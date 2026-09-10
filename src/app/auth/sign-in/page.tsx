import Link from 'next/link'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { AuthProviderButtons } from '@/components/auth/AuthProviderButtons'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { Brand } from '@/components/ui/Brand'
import { getTurnstileSiteKey } from '@/lib/auth/captcha'
import { signInAction } from '../actions'

type SignInPageProps = {
  searchParams: Promise<{
    error?: string
    next?: string
    status?: string
  }>
}

/**
 * The same member card as sign-up, presented rather than issued: one column,
 * no portrait, two fields. Someone coming back has already read the pitch and
 * wants the door opened, so this is the smaller of the two objects.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, next, status } = await searchParams
  const destination = next || '/dashboard'

  return (
    <main className="club-pass-ground">
      <article className="club-pass club-pass-slim">
        <header className="club-pass-band">
          <Brand href="/" light />
          <span className="club-pass-serial">Member sign in</span>
        </header>

        <div className="club-pass-body">
          <section className="club-pass-form">
            <h1>Good to see you again.</h1>
            <p>Your notes, your plans, your people — right where you left them.</p>

            <div className="mt-4">
              <AuthMessage error={error} status={status} />
              <AuthProviderButtons
                formId="sign-in-oauth-form"
                next={destination}
                source="/auth/sign-in"
              />
              <form
                action={signInAction}
                className="space-y-3"
                id="sign-in-password-form"
              >
                <input name="next" type="hidden" value={destination} />
                <label className="block">
                  <span className="club-pass-label">Email</span>
                  <input
                    autoComplete="email"
                    className="app-field mt-1.5 px-3.5 text-[13px]"
                    name="email"
                    placeholder="you@college.edu"
                    required
                    type="email"
                  />
                </label>
                <label className="block">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="club-pass-label">Password</span>
                    <Link
                      className="text-[11px] font-semibold text-club-purple underline"
                      href="/auth/forgot-password"
                    >
                      Forgot it?
                    </Link>
                  </span>
                  <input
                    autoComplete="current-password"
                    className="app-field mt-1.5 px-3.5 text-[13px]"
                    minLength={8}
                    name="password"
                    required
                    type="password"
                  />
                </label>

                <div className="pt-0.5">
                  <CaptchaWidget
                    action="sign_in"
                    formIds={['sign-in-password-form']}
                    siteKey={getTurnstileSiteKey()}
                    variant="stamp"
                  />
                </div>

                <SubmitButton idleLabel="Sign in" pendingLabel="Opening vault…" />
              </form>
            </div>
          </section>
        </div>

        <footer className="club-pass-foot">
          <span>
            New to ClassVault?{' '}
            <Link className="font-bold text-club-purple underline" href="/auth/sign-up">
              Create an account
            </Link>
          </span>
          <nav aria-label="Account legal links">
            <Link href="/">Back to ClassVault</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
          </nav>
        </footer>
      </article>
    </main>
  )
}
