import Link from 'next/link'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { AuthShell } from '@/components/auth/AuthShell'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { getTurnstileSiteKey } from '@/lib/auth/captcha'
import { requestPasswordResetAction } from '../actions'

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error, status } = await searchParams

  return (
    <AuthShell
      description="We will send a secure link that lets you choose a new password."
      eyebrow="Password recovery"
      footer={
        <Link className="font-bold text-[#17453a] underline" href="/auth/sign-in">
          Return to sign in
        </Link>
      }
      title="Find your key."
    >
      <AuthMessage error={error} status={status} />
      <CaptchaWidget
        action="password_reset"
        formIds={['password-reset-form']}
        siteKey={getTurnstileSiteKey()}
      />
      <form
        action={requestPasswordResetAction}
        className="space-y-5"
        id="password-reset-form"
      >
        <label className="block">
          <span className="text-sm font-bold">Account email</span>
          <input
            autoComplete="email"
            className="app-field mt-2 px-4"
            name="email"
            placeholder="you@college.edu"
            required
            type="email"
          />
        </label>
        <SubmitButton idleLabel="Send reset link" pendingLabel="Sending link…" />
      </form>
    </AuthShell>
  )
}
