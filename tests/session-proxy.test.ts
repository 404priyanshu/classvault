import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

import { updateSession } from '@/lib/supabase/proxy'

describe('session proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
  })

  it('redirects unauthenticated protected requests and preserves their path', async () => {
    createServerClientMock.mockReturnValue({
      auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) },
    })

    const response = await updateSession(
      new NextRequest('http://localhost:3000/dashboard?tab=notes'),
    )

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/auth/sign-in')
    expect(location.searchParams.get('next')).toBe('/dashboard?tab=notes')
  })

  it('allows a protected request with validated claims', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'user-id' } },
        }),
      },
    })

    const response = await updateSession(
      new NextRequest('http://localhost:3000/onboarding'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('allows public requests even without a session', async () => {
    createServerClientMock.mockReturnValue({
      auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) },
    })

    const response = await updateSession(
      new NextRequest('http://localhost:3000/auth/sign-in'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('sends a signed-in student off the sign-in page instead of asking again', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi
          .fn()
          .mockResolvedValue({ data: { claims: { sub: 'user-id' } } }),
      },
    })

    const response = await updateSession(
      new NextRequest('http://localhost:3000/auth/sign-in'),
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe(
      '/dashboard',
    )
  })

  it('honours where the signed-in student was originally headed', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi
          .fn()
          .mockResolvedValue({ data: { claims: { sub: 'user-id' } } }),
      },
    })

    const response = await updateSession(
      new NextRequest(
        'http://localhost:3000/auth/sign-in?next=%2Fdashboard%2Fnotes',
      ),
    )

    expect(new URL(response.headers.get('location')!).pathname).toBe(
      '/dashboard/notes',
    )
  })

  it('refuses an off-site next target', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi
          .fn()
          .mockResolvedValue({ data: { claims: { sub: 'user-id' } } }),
      },
    })

    const response = await updateSession(
      new NextRequest(
        'http://localhost:3000/auth/sign-in?next=%2F%2Fevil.example.com',
      ),
    )

    const location = new URL(response.headers.get('location')!)
    expect(location.host).toBe('localhost:3000')
    expect(location.pathname).toBe('/dashboard')
  })

  it('leaves the rest of /auth reachable with a session', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi
          .fn()
          .mockResolvedValue({ data: { claims: { sub: 'user-id' } } }),
      },
    })

    for (const path of ['/auth/update-password', '/auth/confirm', '/auth/error']) {
      const response = await updateSession(
        new NextRequest(`http://localhost:3000${path}`),
      )

      expect(response.headers.get('x-middleware-next')).toBe('1')
    }
  })

  it('carries refreshed cookies onto the sign-in redirect', async () => {
    // Supabase writes cleared or refreshed cookies through setAll while the
    // request runs; a bare redirect would drop them and repeat the failure.
    createServerClientMock.mockImplementation((_url, _key, options) => ({
      auth: {
        getClaims: vi.fn().mockImplementation(async () => {
          options.cookies.setAll(
            [
              {
                name: 'sb-project-auth-token',
                options: { maxAge: 0, path: '/' },
                value: '',
              },
            ],
            {},
          )
          return { data: null }
        }),
      },
    }))

    const response = await updateSession(
      new NextRequest('http://localhost:3000/dashboard'),
    )

    expect(response.status).toBe(307)
    expect(response.cookies.get('sb-project-auth-token')?.value).toBe('')
  })
})
