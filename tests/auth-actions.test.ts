import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url })
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import {
  requestPasswordResetAction,
  requestPhoneOtpAction,
  signInAction,
  signUpAction,
} from '@/app/auth/actions'

function formData(values: Record<string, string>) {
  const data = new FormData()

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value)
  })

  return data
}

function redirectUrl(error: unknown) {
  return new URL(String((error as { url: string }).url), 'http://localhost:3000')
}

describe('authentication server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
  })

  it('rejects an unsafe post-sign-in redirect', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { signInWithPassword } })

    await expect(
      signInAction(
        formData({
          email: 'student@example.com',
          next: '//attacker.example',
          password: 'correct-horse',
        }),
      ),
    ).rejects.toMatchObject({ url: '/dashboard' })

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'student@example.com',
      options: { captchaToken: undefined },
      password: 'correct-horse',
    })
  })

  it('requires a Turnstile token before contacting Supabase', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key'

    let rejection: unknown
    try {
      await signInAction(
        formData({
          email: 'student@example.com',
          next: '/dashboard?from=test',
          password: 'correct-horse',
        }),
      )
    } catch (error) {
      rejection = error
    }

    const url = redirectUrl(rejection)
    expect(url.pathname).toBe('/auth/sign-in')
    expect(url.searchParams.get('next')).toBe('/dashboard?from=test')
    expect(url.searchParams.get('error')).toContain('security check')
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('passes a completed Turnstile token to password sign-in', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key'
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { signInWithPassword } })

    await expect(
      signInAction(
        formData({
          captchaToken: 'verified-turnstile-token',
          email: 'student@example.com',
          next: '/dashboard',
          password: 'correct-horse',
        }),
      ),
    ).rejects.toMatchObject({ url: '/dashboard' })

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'student@example.com',
      options: { captchaToken: 'verified-turnstile-token' },
      password: 'correct-horse',
    })
  })

  it('passes profile metadata and CAPTCHA to account creation', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key'
    const signUp = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })
    createClientMock.mockResolvedValue({ auth: { signUp } })

    await expect(
      signUpAction(
        formData({
          captchaToken: 'verified-turnstile-token',
          email: 'new.student@example.com',
          fullName: 'New Student',
          password: 'correct-horse',
        }),
      ),
    ).rejects.toMatchObject({
      url: '/auth/check-email?email=new.student%40example.com',
    })

    expect(signUp).toHaveBeenCalledWith({
      email: 'new.student@example.com',
      options: {
        captchaToken: 'verified-turnstile-token',
        data: { full_name: 'New Student' },
        emailRedirectTo:
          'http://localhost:3000/auth/confirm?next=/onboarding',
      },
      password: 'correct-horse',
    })
  })

  it('normalizes a phone number and protects the OTP request', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key'
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { signInWithOtp } })

    let rejection: unknown
    try {
      await requestPhoneOtpAction(
        formData({
          captchaToken: 'verified-turnstile-token',
          countryCode: '+91',
          next: '/onboarding',
          phoneNumber: '09876 543210',
        }),
      )
    } catch (error) {
      rejection = error
    }

    expect(signInWithOtp).toHaveBeenCalledWith({
      options: { captchaToken: 'verified-turnstile-token' },
      phone: '+919876543210',
    })
    const url = redirectUrl(rejection)
    expect(url.pathname).toBe('/auth/phone')
    expect(url.searchParams.get('phone')).toBe('+919876543210')
    expect(url.searchParams.get('next')).toBe('/onboarding')
  })

  it('keeps password recovery non-enumerating while sending CAPTCHA', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key'
    const resetPasswordForEmail = vi.fn().mockResolvedValue({
      error: { code: 'user_not_found', message: 'No user', status: 400 },
    })
    createClientMock.mockResolvedValue({
      auth: { resetPasswordForEmail },
    })

    let rejection: unknown
    try {
      await requestPasswordResetAction(
        formData({
          captchaToken: 'verified-turnstile-token',
          email: 'unknown@example.com',
        }),
      )
    } catch (error) {
      rejection = error
    }

    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'unknown@example.com',
      {
        captchaToken: 'verified-turnstile-token',
        redirectTo:
          'http://localhost:3000/auth/confirm?next=/auth/update-password',
      },
    )
    const url = redirectUrl(rejection)
    expect(url.searchParams.get('status')).toContain('If an account exists')
    expect(url.searchParams.has('error')).toBe(false)
  })
})
