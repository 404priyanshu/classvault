'use client'

import { Turnstile } from '@marsidev/react-turnstile'
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

  return (
    <div className="my-5 rounded-lg border border-[#171512]/20 bg-white/65 p-3">
      <Turnstile
        className="min-h-[65px] w-full"
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
        className={`mt-2 text-xs font-semibold ${
          status === 'error' ? 'text-red-700' : 'text-[#171512]/55'
        }`}
      >
        {status === 'verified'
          ? 'Security check complete.'
          : status === 'error'
            ? 'The security check could not load. Check your connection and try again.'
            : 'Complete the security check before continuing.'}
      </p>
    </div>
  )
}
