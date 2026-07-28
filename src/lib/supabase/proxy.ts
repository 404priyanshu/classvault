import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'
import { getSupabaseConfig, isSupabaseConfigured } from './config'

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
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
