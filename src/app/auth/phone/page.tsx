import { ArrowLeft, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { CaptchaWidget } from '@/components/auth/CaptchaWidget'
import { AuthShell } from '@/components/auth/AuthShell'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { getTurnstileSiteKey } from '@/lib/auth/captcha'
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  PHONE_COUNTRIES,
} from '@/lib/auth/phone'
import {
  requestPhoneOtpAction,
  verifyPhoneOtpAction,
} from '../actions'

type PhoneAuthPageProps = {
  searchParams: Promise<{
    error?: string
    next?: string
    phone?: string
    status?: string
  }>
}

export default async function PhoneAuthPage({
  searchParams,
}: PhoneAuthPageProps) {
  const { error, next = '/dashboard', phone, status } = await searchParams
  const isVerifying = Boolean(phone)

  return (
    <AuthShell
      description={
        isVerifying
          ? `Enter the code sent to ${phone}.`
          : 'Use your mobile number to receive a one-time sign-in code.'
      }
      eyebrow={isVerifying ? 'Check your messages' : 'Password-free access'}
      footer={
        <Link
          className="inline-flex items-center gap-1.5 font-bold text-[#17453a] underline"
          href="/auth/sign-in"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all sign-in options
        </Link>
      }
      title={isVerifying ? 'Enter your code.' : 'Continue by phone.'}
    >
      <AuthMessage error={error} status={status} />

      {isVerifying && phone ? (
        <>
          <form action={verifyPhoneOtpAction} className="space-y-5">
            <input name="next" type="hidden" value={next} />
            <input name="phone" type="hidden" value={phone} />
            <label className="block">
              <span className="text-sm font-bold">Six-digit code</span>
              <div className="relative mt-2">
                <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
                <input
                  autoComplete="one-time-code"
                  autoFocus
                  className="h-14 w-full border border-[#171512]/22 bg-white pl-11 pr-4 text-center font-mono text-2xl font-black tracking-[0.35em] outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
                  inputMode="numeric"
                  maxLength={6}
                  name="token"
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  required
                />
              </div>
            </label>
            <SubmitButton
              idleLabel="Verify and continue"
              pendingLabel="Checking code…"
            />
          </form>

          <div className="mt-6 flex items-center justify-between gap-4 text-sm">
            <form action={requestPhoneOtpAction} id="phone-resend-form">
              <input name="next" type="hidden" value={next} />
              <input name="phone" type="hidden" value={phone} />
              <button
                className="font-bold text-[#17453a] underline"
                type="submit"
              >
                Send another code
              </button>
            </form>
            <Link
              className="font-semibold text-[#171512]/60 underline"
              href={`/auth/phone?${new URLSearchParams({ next }).toString()}`}
            >
              Change number
            </Link>
          </div>
          <CaptchaWidget
            action="phone_otp_resend"
            formIds={['phone-resend-form']}
            siteKey={getTurnstileSiteKey()}
          />
        </>
      ) : (
        <form
          action={requestPhoneOtpAction}
          className="space-y-5"
          id="phone-otp-request-form"
        >
          <input name="next" type="hidden" value={next} />
          <fieldset>
            <legend className="text-sm font-bold">Mobile number</legend>
            <div className="mt-2 grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3">
              <label>
                <span className="sr-only">Country code</span>
                <select
                  autoComplete="tel-country-code"
                  className="h-12 w-full border border-[#171512]/22 bg-white px-3 text-sm font-bold outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
                  defaultValue={DEFAULT_PHONE_COUNTRY_CODE}
                  name="countryCode"
                >
                  {PHONE_COUNTRIES.map((country) => (
                    <option
                      key={country.iso}
                      value={country.code}
                    >
                      {country.code} {country.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="relative block">
                <span className="sr-only">Phone number</span>
                <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
                <input
                  autoComplete="tel-national"
                  className="h-12 w-full border border-[#171512]/22 bg-white pl-10 pr-2 text-sm outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
                  inputMode="tel"
                  name="phoneNumber"
                  placeholder="9876543210"
                  required
                  type="tel"
                />
              </label>
            </div>
            <span className="mt-2 block text-xs leading-relaxed text-[#171512]/55">
              Select your country code, then enter the mobile number without it.
              Standard SMS charges may apply.
            </span>
          </fieldset>
          <CaptchaWidget
            action="phone_otp_request"
            formIds={['phone-otp-request-form']}
            siteKey={getTurnstileSiteKey()}
          />
          <SubmitButton idleLabel="Send OTP" pendingLabel="Sending code…" />
        </form>
      )}
    </AuthShell>
  )
}
