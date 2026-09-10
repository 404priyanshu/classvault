import { cache } from 'react'
import { createClient } from './server'

/**
 * Request-scoped claims.
 *
 * Rendering one dashboard screen asks who the student is at least three times:
 * the proxy validates the JWT, the layout reads it, and the page reads it
 * again. Each call reaches `getSession`, which refreshes an expired token and
 * fetches the signing key, so the repeats are real work rather than a lookup.
 *
 * React's `cache` collapses them to one per request. It does not persist
 * between requests, so this changes how often the claims are read, never how
 * fresh they are: every request still validates the JWT exactly once before
 * trusting it.
 */
export const getRequestClaims = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  return data?.claims ?? null
})
