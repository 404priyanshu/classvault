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
      description="Supabase will finish creating your session after you confirm your address."
      eyebrow="One last step"
      footer={
        <Link className="font-bold text-[#17453a] underline" href="/auth/sign-in">
          Return to sign in
        </Link>
      }
      title="Check your inbox."
    >
      <div className="border-[1.5px] border-[#17453a] bg-[#17453a]/10 p-5 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-[#17453a]" />
        <p className="mt-3 text-sm leading-relaxed text-[#171512]/70">
          We sent a confirmation link
          {email ? (
            <>
              {' '}
              to <strong className="text-[#171512]">{email}</strong>
            </>
          ) : null}
          . Open it in this browser to continue.
        </p>
      </div>
    </AuthShell>
  )
}
