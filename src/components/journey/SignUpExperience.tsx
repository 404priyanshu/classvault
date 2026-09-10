'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useActionState, useState } from 'react'
import { signUpWithFeedbackAction } from '@/app/auth/actions'
import { AuthProviderButtons } from '@/components/auth/AuthProviderButtons'
import { ClearAuthMessageParams } from '@/components/auth/ClearAuthMessageParams'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { Spinner } from '@/components/ui/spinner'
import { JourneyShell } from './JourneyShell'
import styles from './Journey.module.css'

export function SignUpExperience({
  error: initialError,
  siteKey,
}: {
  error?: string
  siteKey: string | null
}) {
  const [state, action, pending] = useActionState(signUpWithFeedbackAction, {
    error: null,
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const error = pending ? null : state.attempt ? state.error : initialError
  return (
    <JourneyShell
      account
      mood={pending ? 'thinking' : error ? 'help' : 'welcome'}
      title={
        <>
          Good notes.
          <br />
          Great company.
          <br />
          Your next chapter.
        </>
      }
      message="A place for your campus, your goals, and you."
    >
      {initialError ? <ClearAuthMessageParams /> : null}
      <div className={styles.signupTitle}>
        <h1 className={styles.heading}>Come on in.</h1>
        <p className={styles.description}>
          Create your free account. Then we’ll make a little space for the way
          you study.
        </p>
      </div>
      <AuthProviderButtons
        formId="sign-up-oauth-form"
        next="/onboarding"
        source="/auth/sign-up"
      />
      <form
        action={action}
        onReset={(event) => event.preventDefault()}
        className={styles.signupForm}
        id="sign-up-password-form"
        aria-busy={pending}
      >
        <fieldset disabled={pending} className={styles.signupPair}>
          <legend className="sr-only">Your account details</legend>
          <label>
            <span className={styles.label}>Name</span>
            <input
              className={styles.input}
              autoComplete="name"
              name="fullName"
              minLength={2}
              maxLength={80}
              required
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            <span className={styles.label}>Email</span>
            <input
              className={styles.input}
              autoComplete="email"
              name="email"
              type="email"
              required
              placeholder="you@college.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        </fieldset>
        <div>
          <label htmlFor="signup-password" className={styles.label}>
            Password
          </label>
          <span className={styles.signupPassword}>
            <input
              className={styles.input}
              id="signup-password"
              autoComplete="new-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              maxLength={72}
              disabled={pending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby="password-hint"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
          <span id="password-hint" className={styles.hint}>
            Use 8–72 characters. Make it yours, keep it private.
          </span>
        </div>
        <CaptchaWidget
          key={state.attempt || 0}
          action="sign_up"
          formIds={['sign-up-password-form']}
          siteKey={siteKey}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error} Your details are still here.
          </p>
        ) : null}
        <button className={styles.primary} disabled={pending} type="submit">
          {pending ? <Spinner decorative size={22} /> : null}
          {pending ? 'Creating your account…' : 'Create free account'}
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </button>
        <p className={styles.signupNote}>
          We may ask you to confirm your email before student setup.
          <br />
          By continuing, you agree to our <Link href="/legal/terms">
            Terms
          </Link>{' '}
          and <Link href="/legal/privacy">Privacy Policy</Link>.
        </p>
      </form>
    </JourneyShell>
  )
}
