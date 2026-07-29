'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isSupportedPhoneCountryCode } from '@/lib/auth/phone'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/supabase/config'

const emailSchema = z.string().trim().email().max(254)
const passwordSchema = z.string().min(8).max(72)
const oauthProviderSchema = z.enum(['google', 'github'])
const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[()\s-]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/))
const nationalPhoneSchema = z
  .string()
  .trim()
  .regex(/^[\d()\s-]{6,20}$/)
  .transform((value) => value.replace(/\D/g, '').replace(/^0+/, ''))
  .pipe(z.string().min(6).max(14))
const phoneOtpSchema = z.string().trim().regex(/^\d{6}$/)

type PhoneOtpRequestError = {
  code?: string
  message: string
  name?: string
  status?: number
}

function getPhoneOtpRequestErrorMessage(error: PhoneOtpRequestError) {
  switch (error.code) {
    case 'over_sms_send_rate_limit':
      return 'A code was requested too recently. Wait at least 60 seconds, then try again.'
    case 'over_request_rate_limit':
      return 'Too many sign-in attempts were made. Wait a few minutes, then try again.'
    case 'phone_provider_disabled':
    case 'otp_disabled':
      return 'Phone sign-in is disabled in Supabase. Enable the Phone provider and phone sign-ups, then try again.'
    case 'sms_send_failed':
      return 'The SMS provider rejected this request. Check the Twilio Verify credentials, trial recipient, and country permissions.'
    case 'request_timeout':
      return 'The SMS provider took too long to respond. Please try again.'
    case 'validation_failed':
      return 'That mobile number could not be accepted. Check the country code and number, then try again.'
    default:
      return 'We could not send the code. Please try again, or check the server log for the provider error.'
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function safeNextPath(value: string, fallback = '/dashboard') {
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

function withMessage(
  pathname: string,
  kind: 'error' | 'status',
  message: string,
) {
  const params = new URLSearchParams({ [kind]: message })
  return `${pathname}?${params.toString()}`
}

function withPhoneMessage(
  kind: 'error' | 'status',
  message: string,
  options: { next: string; phone?: string },
) {
  const params = new URLSearchParams({
    [kind]: message,
    next: options.next,
  })

  if (options.phone) {
    params.set('phone', options.phone)
  }

  return `/auth/phone?${params.toString()}`
}

function readPhone(formData: FormData) {
  const completePhone = readString(formData, 'phone')

  if (completePhone) {
    return phoneSchema.safeParse(completePhone)
  }

  const countryCode = readString(formData, 'countryCode')
  const nationalPhone = nationalPhoneSchema.safeParse(
    readString(formData, 'phoneNumber'),
  )

  if (!isSupportedPhoneCountryCode(countryCode) || !nationalPhone.success) {
    return phoneSchema.safeParse('')
  }

  return phoneSchema.safeParse(`${countryCode}${nationalPhone.data}`)
}

export async function signInWithOAuthAction(formData: FormData) {
  const provider = oauthProviderSchema.safeParse(
    readString(formData, 'provider'),
  )
  const next = safeNextPath(readString(formData, 'next'))
  const source =
    readString(formData, 'source') === '/auth/sign-up'
      ? '/auth/sign-up'
      : '/auth/sign-in'

  if (!provider.success) {
    redirect(
      withMessage(source, 'error', 'That sign-in provider is unavailable.'),
    )
  }

  const callbackUrl = new URL('/auth/confirm', getSiteUrl())
  callbackUrl.searchParams.set('next', next)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.data,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  })

  if (error || !data.url) {
    redirect(
      withMessage(
        source,
        'error',
        `${provider.data === 'google' ? 'Google' : 'GitHub'} sign-in is not configured yet.`,
      ),
    )
  }

  redirect(data.url)
}

export async function requestPhoneOtpAction(formData: FormData) {
  const phone = readPhone(formData)
  const next = safeNextPath(readString(formData, 'next'))

  if (!phone.success) {
    redirect(
      withPhoneMessage(
        'error',
        'Choose a country code and enter a valid mobile number.',
        { next },
      ),
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone: phone.data,
  })

  if (error) {
    console.error('Phone OTP request failed', {
      code: error.code,
      message: error.message,
      name: error.name,
      status: error.status,
    })

    redirect(
      withPhoneMessage(
        'error',
        getPhoneOtpRequestErrorMessage(error),
        { next },
      ),
    )
  }

  redirect(
    withPhoneMessage('status', 'We sent a six-digit code to your phone.', {
      next,
      phone: phone.data,
    }),
  )
}

export async function verifyPhoneOtpAction(formData: FormData) {
  const phone = phoneSchema.safeParse(readString(formData, 'phone'))
  const token = phoneOtpSchema.safeParse(readString(formData, 'token'))
  const next = safeNextPath(readString(formData, 'next'))

  if (!phone.success || !token.success) {
    redirect(
      withPhoneMessage(
        'error',
        'Enter the complete six-digit code from your message.',
        {
          next,
          phone: phone.success ? phone.data : undefined,
        },
      ),
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.data,
    token: token.data,
    type: 'sms',
  })

  if (error || !data.session) {
    redirect(
      withPhoneMessage(
        'error',
        'That code is incorrect or has expired. Request a new one and try again.',
        {
          next,
          phone: phone.data,
        },
      ),
    )
  }

  redirect(next)
}

export async function signInAction(formData: FormData) {
  const email = emailSchema.safeParse(readString(formData, 'email'))
  const password = passwordSchema.safeParse(readString(formData, 'password'))
  const next = safeNextPath(readString(formData, 'next'))

  if (!email.success || !password.success) {
    redirect(
      withMessage(
        '/auth/sign-in',
        'error',
        'Enter a valid email and a password of at least 8 characters.',
      ),
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  })

  if (error) {
    redirect(
      withMessage(
        '/auth/sign-in',
        'error',
        'The email or password is incorrect.',
      ),
    )
  }

  redirect(next)
}

export async function signUpAction(formData: FormData) {
  const fullName = z
    .string()
    .trim()
    .min(2)
    .max(80)
    .safeParse(readString(formData, 'fullName'))
  const email = emailSchema.safeParse(readString(formData, 'email'))
  const password = passwordSchema.safeParse(readString(formData, 'password'))

  if (!fullName.success || !email.success || !password.success) {
    redirect(
      withMessage(
        '/auth/sign-up',
        'error',
        'Use your name, a valid email, and a password between 8 and 72 characters.',
      ),
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      data: {
        full_name: fullName.data,
      },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/onboarding`,
    },
  })

  if (error) {
    redirect(
      withMessage(
        '/auth/sign-up',
        'error',
        'We could not create the account. Please try again shortly.',
      ),
    )
  }

  if (data.session) {
    redirect('/onboarding')
  }

  const params = new URLSearchParams({ email: email.data })
  redirect(`/auth/check-email?${params.toString()}`)
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = emailSchema.safeParse(readString(formData, 'email'))

  if (!email.success) {
    redirect(
      withMessage(
        '/auth/forgot-password',
        'error',
        'Enter a valid email address.',
      ),
    )
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/auth/update-password`,
  })

  redirect(
    withMessage(
      '/auth/forgot-password',
      'status',
      'If an account exists for that email, a reset link is on its way.',
    ),
  )
}

export async function updatePasswordAction(formData: FormData) {
  const password = passwordSchema.safeParse(readString(formData, 'password'))
  const confirmation = readString(formData, 'passwordConfirmation')

  if (!password.success || password.data !== confirmation) {
    redirect(
      withMessage(
        '/auth/update-password',
        'error',
        'Passwords must match and contain between 8 and 72 characters.',
      ),
    )
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    redirect(
      withMessage(
        '/auth/sign-in',
        'error',
        'Your password-reset session has expired. Request a new link.',
      ),
    )
  }

  const { error } = await supabase.auth.updateUser({
    password: password.data,
  })

  if (error) {
    redirect(
      withMessage(
        '/auth/update-password',
        'error',
        'The password could not be updated. Request a new reset link.',
      ),
    )
  }

  redirect(
    withMessage(
      '/dashboard',
      'status',
      'Your password has been updated.',
    ),
  )
}

export async function signOutAction() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (claims) {
    await supabase.auth.signOut()
  }

  redirect('/')
}
