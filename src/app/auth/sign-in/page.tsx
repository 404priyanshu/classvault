import Link from 'next/link'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { AuthProviderButtons } from '@/components/auth/AuthProviderButtons'
import { AuthShell } from '@/components/auth/AuthShell'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { getTurnstileSiteKey } from '@/lib/auth/captcha'
import { signInAction } from '../actions'

type SignInPageProps = {
  searchParams: Promise<{
    error?: string
    next?: string
    status?: string
  }>
}

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const { error, next, status } = await searchParams

  return (
    <AuthShell
      description="Open your notes, roadmaps, and study spaces from one quiet corner."
      eyebrow="Welcome back"
      footer={
        <>
          New to ClassVault?{' '}
          <Link className="font-bold text-[#17453a] underline" href="/auth/sign-up">
            Create an account
          </Link>
        </>
      }
      title="Unlock your vault."
    >
      <AuthMessage error={error} status={status} />
      <AuthProviderButtons
        formId="sign-in-oauth-form"
        next={next || '/dashboard'}
        source="/auth/sign-in"
      />
      <CaptchaWidget
        action="sign_in"
        formIds={['sign-in-password-form']}
        siteKey={getTurnstileSiteKey()}
      />
      <form
        action={signInAction}
        className="space-y-5"
        id="sign-in-password-form"
      >
        <input name="next" type="hidden" value={next || '/dashboard'} />
        <label className="block">
          <span className="text-sm font-bold">Email</span>
          <input
            autoComplete="email"
            className="app-field mt-2 px-4"
            name="email"
            placeholder="you@college.edu"
            required
            type="email"
          />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm font-bold">
            Password
            <Link
              className="font-semibold text-[#17453a] underline"
              href="/auth/forgot-password"
            >
              Forgot it?
            </Link>
          </span>
          <input
            autoComplete="current-password"
            className="app-field mt-2 px-4"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <SubmitButton idleLabel="Sign in" pendingLabel="Opening vault…" />
      </form>
    </AuthShell>
  )
}
