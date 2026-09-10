import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { JourneyShell } from '@/components/journey/JourneyShell'
import styles from '@/components/journey/Journey.module.css'

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  return (
    <JourneyShell
      mood="thinking"
      title={
        <>
          One little check.
          <br />
          Then you’re on your way.
        </>
      }
      message="Your next chapter is waiting in your inbox."
    >
      <h1 className={styles.heading}>Check your inbox.</h1>
      <p className={styles.description}>
        Confirm your email before we continue with your student setup.
      </p>
      <div className={styles.checkEmail}>
        <Mail aria-hidden="true" />
        <p>
          If this address is eligible for registration, a confirmation link is
          on its way
          {email ? (
            <>
              {' '}
              to<strong>{email}</strong>
            </>
          ) : null}
          .
        </p>
        <p className="mt-4">
          Open the link in this browser to continue. Your account is ready to
          use only after confirmation.
        </p>
      </div>
      <p className={styles.description}>
        Can’t find it? Check spam or promotions. If you already have an account,
        you can sign in instead.
      </p>
      <div className={styles.welcomeActions}>
        <Link className={styles.primary} href="/auth/sign-in?next=/onboarding">
          Continue to sign in
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link className={styles.secondary} href="/auth/sign-up">
          Use a different email
        </Link>
      </div>
    </JourneyShell>
  )
}
