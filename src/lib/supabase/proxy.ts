import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'
import { getSupabaseConfig, isSupabaseConfigured } from './config'

/**
 * The pages whose whole job is to start a session. A student who still has one
 * has no reason to see them, and showing the sign-in form to someone already
 * signed in is indistinguishable from having been logged out.
 *
 * The rest of `/auth` stays reachable with a session on purpose:
 * `/auth/update-password` requires one, `/auth/confirm` is finishing a link,
 * and `/auth/error` has to be able to explain itself.
 */
const AUTH_ENTRY_PATHS = new Set([
  '/auth/forgot-password',
  '/auth/phone',
  '/auth/sign-in',
  '/auth/sign-up',
])

function safeNextPath(value: string | null, fallback = '/dashboard') {
  return value && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback
}

/**
 * Moves any cookies Supabase wrote during this request onto another response.
 *
 * A refresh — successful or failed — writes new or cleared auth cookies while
 * the request runs. Returning a bare `NextResponse.redirect()` drops them,
 * so a cleared session is never actually cleared in the browser and the next
 * request repeats the same failure.
 */
function carrySessionCookies(
  target: NextResponse,
  source: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })

  return target
}

export async function updateSession(request: NextRequest) {
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/onboarding')

  if (!isSupabaseConfigured()) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/error'
      url.search = ''
      url.searchParams.set(
        'message',
        'Supabase credentials have not been added to .env.local yet.',
      )
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })
  const { publishableKey, url } = getSupabaseConfig()

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        supabaseResponse = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, options, value }) => {
          supabaseResponse.cookies.set(name, value, options)
        })

        Object.entries(headersToSet).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value)
        })
      },
    },
  })

  // getClaims validates the JWT. Never authorize server access with getSession.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.search = ''
    url.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )
    return carrySessionCookies(NextResponse.redirect(url), supabaseResponse)
  }

  // A live session landing on a sign-in page means the session was refreshed
  // here a moment ago; send the student on instead of asking them to prove
  // again what the cookie already proved.
  if (claims && AUTH_ENTRY_PATHS.has(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = safeNextPath(request.nextUrl.searchParams.get('next'))
    url.search = ''
    return carrySessionCookies(NextResponse.redirect(url), supabaseResponse)
  }

  return supabaseResponse
}
