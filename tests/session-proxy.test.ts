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
})
