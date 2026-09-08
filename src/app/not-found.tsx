import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'
import { Brand } from '@/components/ui/Brand'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-club-bg px-5 py-12 text-club-ink">
      <div className="w-full max-w-lg text-center">
        <Brand className="justify-center" />
        <div className="mt-10 rounded-[32px] bg-club-lavender px-6 py-12 sm:px-10">
          <Compass aria-hidden className="mx-auto h-16 w-16 text-club-purple" strokeWidth={1.4} />
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-club-purple">A small detour · 404</p>
          <h1 className="app-title mt-3">This corner is missing.</h1>
          <p className="mt-4 text-sm leading-relaxed text-club-muted">That page may have moved, or it may no longer be available. Let’s get you back to familiar ground.</p>
          <Link href="/" className="btn-ink mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold"><ArrowLeft size={16} /> Back to ClassVault</Link>
        </div>
      </div>
    </main>
  )
}
