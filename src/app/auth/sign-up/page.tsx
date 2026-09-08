import Image from 'next/image'
import Link from 'next/link'
import clubhouse from '@/assets/study-clubhouse.webp'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { AuthProviderButtons } from '@/components/auth/AuthProviderButtons'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { Brand } from '@/components/ui/Brand'
import { getTurnstileSiteKey } from '@/lib/auth/captcha'
import { signUpAction } from '../actions'

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>
}

/**
 * Sign-up does not use AuthShell. The other six auth screens are checkpoints
 * on the way somewhere; this one is the moment a student joins, and it is
 * built as the thing being issued -- a campus card you fill in and that gets
 * stamped -- rather than a form sitting beside a picture.
 */
export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams

  return (
    <main className="club-pass-ground">
      <article className="club-pass">
        <header className="club-pass-band">
          <Brand href="/" light />
          <span className="club-pass-serial">New member card</span>
        </header>

        <div className="club-pass-body">
          <aside className="club-pass-photo">
            <Image
              alt="The ClassVault study crew in a clubhouse built out of books."
              className="club-pass-photo-art"
              sizes="(max-width: 820px) 92px, 264px"
              src={clubhouse}
            />
            <div>
              <h2>Notes your classmates actually rated.</h2>
              <p>
                Scoped to your university, ranked by the people sitting the
                same exam.
              </p>
            </div>
            <span>Starting at Bennett University</span>
          </aside>

          <section className="club-pass-form">
            <h1>Come on in.</h1>
            <p>Three ways in — pick whichever you already trust.</p>

            <div className="mt-4">
              <AuthMessage error={error} />
              <AuthProviderButtons
                formId="sign-up-oauth-form"
                next="/onboarding"
                source="/auth/sign-up"
              />
              <form
                action={signUpAction}
                className="space-y-3"
                id="sign-up-password-form"
              >
                <div className="grid gap-3 [@media(min-width:420px)]:grid-cols-2 [@media(max-height:760px)_and_(min-width:360px)]:grid-cols-2">
                  <label className="block">
                    <span className="club-pass-label">Name</span>
                    <input
                      autoComplete="name"
                      className="app-field mt-1.5 px-3.5 text-[13px]"
                      maxLength={80}
                      minLength={2}
                      name="fullName"
                      placeholder="Your name"
                      required
                    />
                  </label>
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
                </div>
                <label className="block">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="club-pass-label">Password</span>
                    <span className="text-[11px] font-medium text-club-muted">
                      8–72 characters
                    </span>
                  </span>
                  <input
                    autoComplete="new-password"
                    className="app-field mt-1.5 px-3.5 text-[13px]"
                    maxLength={72}
                    minLength={8}
                    name="password"
                    required
                    type="password"
                  />
                </label>

                {/* The check reads as the stamp that validates the card. */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                  <CaptchaWidget
                    action="sign_up"
                    formIds={['sign-up-password-form']}
                    siteKey={getTurnstileSiteKey()}
                    variant="stamp"
                  />
                  <span className="club-pass-note text-[11px] text-club-muted">
                    Free, and free to leave.
                  </span>
                </div>

                <SubmitButton
                  idleLabel="Create free account"
                  pendingLabel="Creating vault…"
                />
              </form>
            </div>
          </section>
        </div>

        <footer className="club-pass-foot">
          <span>
            Already have an account?{' '}
            <Link className="font-bold text-club-purple underline" href="/auth/sign-in">
              Sign in
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
