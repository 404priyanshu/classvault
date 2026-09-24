import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  'email',
  'email_change',
  'invite',
  'magiclink',
  'recovery',
  'signup',
])

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//')
    ? value
    : '/dashboard'
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const providerError = url.searchParams.get('error')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = safeNextPath(url.searchParams.get('next'))
  const supabase = await createClient()

  // With secure email change on, GoTrue asks for a link from both the old and
  // the new address. The first one confirmed arrives with an informational
  // `message` and no code; the change is half done, not failed.
  if (!code && !tokenHash && !providerError && url.searchParams.get('message')) {
    const halfway = new URL(next, url.origin)
    halfway.searchParams.set(
      'status',
      'One link confirmed. Open the link sent to your other email address to finish.',
    )
    return NextResponse.redirect(halfway)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }
  } else if (tokenHash && type && EMAIL_OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  const errorUrl = new URL('/auth/error', url.origin)
  errorUrl.searchParams.set(
    'message',
    providerError
      ? 'Sign-in was cancelled or could not be completed. Return to sign in and try again.'
      : 'The confirmation link is invalid, expired, or has already been used.',
  )
  return NextResponse.redirect(errorUrl)
}
