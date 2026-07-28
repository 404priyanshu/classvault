'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/supabase/config'

const emailSchema = z.string().trim().email().max(254)
const passwordSchema = z.string().min(8).max(72)

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
