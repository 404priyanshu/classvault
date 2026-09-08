'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-[70dvh] place-items-center px-5 py-12 text-club-ink">
      <section className="w-full max-w-lg rounded-[32px] bg-club-lavender px-6 py-12 text-center sm:px-10">
        <RefreshCw aria-hidden className="mx-auto h-12 w-12 text-club-purple" strokeWidth={1.5} />
        <h1 className="app-title mt-6">A little hiccup.</h1>
        <p className="mt-4 text-sm leading-relaxed text-club-muted">We couldn’t load this part of ClassVault. Give it another try in a moment.</p>
        <button onClick={reset} type="button" className="btn-ink mt-7 rounded-full px-6 py-3 text-sm font-bold">Try again</button>
        <Link href="/" className="mt-5 block text-sm font-semibold text-club-purple underline">Back to ClassVault</Link>
      </section>
    </main>
  )
}
