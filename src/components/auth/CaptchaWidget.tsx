'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type CaptchaWidgetProps = {
  action: string
  formIds: string[]
  siteKey: string | null
  /**
   * `stamp` renders the check as the mark that validates a member card, for
   * sign-up. Everywhere else it stays a quiet status line.
   */
  variant?: 'line' | 'stamp'
}

export function CaptchaWidget({
  action,
  formIds,
  siteKey,
  variant = 'line',
}: CaptchaWidgetProps) {
  const [status, setStatus] = useState<'checking' | 'error' | 'verified'>(
    'checking',
  )
  const [token, setToken] = useState('')
  const container = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    if (!container.current) return
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 300)
    })
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [siteKey])

  if (!siteKey) {
    return null
  }

  const clearToken = () => {
    setToken('')
    setStatus('checking')
  }

  const isVerified = status === 'verified'

  // Turnstile in interaction-only mode renders nothing until it actually needs
  // the student. Wrapping that silence in a bordered panel spent ~100px of a
  // screen that has to fit without scrolling, on a box with nothing in it.
  // The panel returns only when there is something to see: an error.

  return (
    <div
      ref={container}
      className={`club-captcha transition-colors ${
        variant === 'stamp'
          ? ''
          : status === 'error'
            ? 'my-4 rounded-lg border border-red-700/25 bg-red-50/70 px-3 py-2.5'
            : 'my-3'
      }`}
      data-captcha-status={status}
    >
      <div
        aria-hidden={isVerified}
        className={isVerified ? 'h-0 overflow-hidden opacity-0' : ''}
      >
        <Turnstile
          className="w-full"
          onError={() => {
            setToken('')
            setStatus('error')
          }}
          onExpire={clearToken}
          onSuccess={(verifiedToken) => {
            setToken(verifiedToken)
            setStatus('verified')
          }}
          onTimeout={clearToken}
          options={{
            action,
            appearance: 'interaction-only',
            refreshExpired: 'auto',
            responseField: false,
            size: compact ? 'compact' : 'flexible',
            theme: 'light',
          }}
          scriptOptions={{ async: true, defer: true }}
          siteKey={siteKey}
        />
      </div>

      {formIds.map((formId) => (
        <input
          form={formId}
          key={formId}
          name="captchaToken"
          readOnly
          type="hidden"
          value={token}
        />
      ))}

      {variant === 'stamp' ? (
        <p aria-live="polite" className="club-pass-stamp" data-state={status}>
          {isVerified ? (
            <CheckCircle2 aria-hidden className="h-3.5 w-3.5 shrink-0" />
          ) : null}
          {status === 'error' ? (
            <ShieldAlert aria-hidden className="h-3.5 w-3.5 shrink-0" />
          ) : null}
          <span>
            {isVerified
              ? 'Verified'
              : status === 'error'
                ? 'Check failed'
                : 'Verifying'}
          </span>
        </p>
      ) : (
      <p
          aria-live="polite"
          className={`flex items-center gap-1.5 text-[11px] font-semibold ${
            status === 'error'
              ? 'text-xs font-bold text-red-700'
              : isVerified
                ? 'text-club-purple'
                : 'text-club-muted'
          }`}
        >
          {isVerified ? <CheckCircle2 aria-hidden className="h-3.5 w-3.5 shrink-0" /> : null}
          {status === 'error' ? (
            <ShieldAlert aria-hidden className="h-4 w-4 shrink-0" />
          ) : null}
          <span>
            {isVerified
              ? 'Browser verified.'
              : status === 'error'
                ? 'The anti-bot check could not load. Check your connection and try again.'
                : 'Checking your browser…'}
          </span>
        </p>
      )}
    </div>
  )
}
