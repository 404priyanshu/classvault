'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

type CaptchaWidgetProps = {
  action: string
  formIds: string[]
  siteKey: string | null
}

export function CaptchaWidget({
  action,
  formIds,
  siteKey,
}: CaptchaWidgetProps) {
  const [status, setStatus] = useState<'checking' | 'error' | 'verified'>(
    'checking',
  )
  const [token, setToken] = useState('')

  if (!siteKey) {
    return null
  }

  const clearToken = () => {
    setToken('')
    setStatus('checking')
  }

  const isVerified = status === 'verified'

  return (
    <div
      className={`my-5 rounded-lg border px-3 py-2.5 transition-colors ${
        isVerified
          ? 'border-[#17453a]/25 bg-[#17453a]/[0.06]'
          : status === 'error'
            ? 'border-red-700/25 bg-red-50/70'
            : 'border-[#171512]/20 bg-white/65'
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
            size: 'flexible',
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

      <p
        aria-live="polite"
        className={`flex items-center gap-2 text-xs font-bold ${
          status === 'error'
            ? 'text-red-700'
            : isVerified
              ? 'text-[#17453a]'
              : 'text-[#171512]/55'
        }`}
      >
        {isVerified ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
        {status === 'error' ? (
          <ShieldAlert className="h-4 w-4 shrink-0" />
        ) : null}
        <span>
          {isVerified
            ? 'Anti-bot check passed.'
            : status === 'error'
              ? 'The anti-bot check could not load. Check your connection and try again.'
              : 'Checking this browser for automated traffic…'}
        </span>
      </p>
    </div>
  )
}
