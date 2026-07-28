import Link from 'next/link'
import { AuthShell } from '@/components/auth/AuthShell'

type AuthErrorPageProps = {
  searchParams: Promise<{ message?: string }>
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { message } = await searchParams

  return (
    <AuthShell
      description={
        message ||
        'The authentication link is invalid, expired, or has already been used.'
      }
      eyebrow="Authentication error"
      footer={
        <Link className="font-bold text-[#17453a] underline" href="/">
          Return home
        </Link>
      }
      title="This key did not turn."
    >
      <div className="flex flex-col gap-3">
        <Link
          className="btn-saffron rounded-full px-6 py-3 text-center font-black"
          href="/auth/sign-in"
        >
          Try signing in
        </Link>
        <Link
          className="text-center text-sm font-bold text-[#17453a] underline"
          href="/auth/forgot-password"
        >
          Request a password reset
        </Link>
      </div>
    </AuthShell>
  )
}
