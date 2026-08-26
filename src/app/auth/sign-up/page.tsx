import Link from 'next/link'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { AuthProviderButtons } from '@/components/auth/AuthProviderButtons'
import { AuthShell } from '@/components/auth/AuthShell'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { getTurnstileSiteKey } from '@/lib/auth/captcha'
import { signUpAction } from '../actions'

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function SignUpPage({
  searchParams,
}: SignUpPageProps) {
  const { error } = await searchParams

  return (
    <AuthShell
      description="Use an email, social account, or phone number. We’ll personalize your study space next."
      eyebrow="Free to start"
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-bold text-[#17453a] underline" href="/auth/sign-in">
            Sign in
          </Link>
        </>
      }
      title="Create your vault."
    >
      <AuthMessage error={error} />
      <AuthProviderButtons
        formId="sign-up-oauth-form"
        next="/onboarding"
        source="/auth/sign-up"
      />
      <CaptchaWidget
        action="sign_up"
        formIds={['sign-up-password-form']}
        siteKey={getTurnstileSiteKey()}
      />
      <form
        action={signUpAction}
        className="space-y-5"
        id="sign-up-password-form"
      >
        <label className="block">
          <span className="text-sm font-bold">Name</span>
          <input
            autoComplete="name"
            className="app-field mt-2 px-4"
            maxLength={80}
            minLength={2}
            name="fullName"
            placeholder="Your name"
            required
          />
        </label>
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
          <span className="text-sm font-bold">Password</span>
          <input
            autoComplete="new-password"
            className="app-field mt-2 px-4"
            maxLength={72}
            minLength={8}
            name="password"
            required
            type="password"
          />
          <span className="mt-2 block text-xs text-[#171512]/55">
            Use 8–72 characters.
          </span>
        </label>
        <SubmitButton
          idleLabel="Create free account"
          pendingLabel="Creating vault…"
        />
      </form>
    </AuthShell>
  )
}
