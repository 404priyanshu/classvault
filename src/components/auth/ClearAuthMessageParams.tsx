'use client'

import { useEffect } from 'react'

/**
 * Auth results arrive as `?error=` / `?status=` on a redirect, which means the
 * message outlives the submission that caused it: reload the page and the
 * browser replays the same query string, so a student is told again to
 * complete a check they may have already passed.
 *
 * Stripping the params with `replaceState` keeps the message on screen for the
 * render that earned it, then leaves a clean URL behind. It deliberately does
 * not use `router.replace`, which would re-render the route and could clear a
 * half-filled form.
 */
export function ClearAuthMessageParams() {
  useEffect(() => {
    const url = new URL(window.location.href)

    if (!url.searchParams.has('error') && !url.searchParams.has('status')) {
      return
    }

    url.searchParams.delete('error')
    url.searchParams.delete('status')

    // `next` and the rest of the query survive; only the message is dropped.
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  return null
}
