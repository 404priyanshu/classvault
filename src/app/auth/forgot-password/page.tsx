import Link from 'next/link'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { AuthShell } from '@/components/auth/AuthShell'
import { SubmitButton } from '@/components/auth/SubmitButton'
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
      <form action={requestPasswordResetAction} className="space-y-5">
        <label className="block">
          <span className="text-sm font-bold">Account email</span>
          <input
            autoComplete="email"
            className="mt-2 h-12 w-full border-[1.5px] border-[#171512] bg-white px-4 outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
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
