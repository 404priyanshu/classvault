import Link from 'next/link'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { AuthShell } from '@/components/auth/AuthShell'
import { SubmitButton } from '@/components/auth/SubmitButton'
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
      <form action={signInAction} className="space-y-5">
        <input name="next" type="hidden" value={next || '/dashboard'} />
        <label className="block">
          <span className="text-sm font-bold">Email</span>
          <input
            autoComplete="email"
            className="mt-2 h-12 w-full border-[1.5px] border-[#171512] bg-white px-4 outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
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
            className="mt-2 h-12 w-full border-[1.5px] border-[#171512] bg-white px-4 outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
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
