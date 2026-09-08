import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'

type CheckEmailPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const { email } = await searchParams

  return (
    <AuthShell
      description="We'll finish setting up your account once you confirm your address."
      eyebrow="One last step"
      footer={
        <Link className="font-bold text-club-purple underline" href="/auth/sign-in">
          Return to sign in
        </Link>
      }
      title="Check your inbox."
    >
      <div className="border border-club-purple bg-club-purple/10 p-5 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-club-purple" />
        <p className="mt-3 text-sm leading-relaxed text-club-muted">
          We sent a confirmation link
          {email ? (
            <>
              {' '}
              to <strong className="text-club-ink">{email}</strong>
            </>
          ) : null}
          . Open it in this browser to continue.
        </p>
      </div>
    </AuthShell>
  )
}
