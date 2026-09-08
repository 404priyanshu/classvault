import Link from 'next/link'
import { Brand } from '@/components/ui/Brand'

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-dvh bg-club-bg">


      <header className="relative border-b-[1.5px] border-club-ink/15">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Brand />
          <Link
            className="text-sm font-bold text-club-purple underline"
            href="/"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-14">{children}</main>

      <footer className="relative border-t-[1.5px] border-club-ink/15">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm font-medium text-club-muted">
          <span>© 2026 ClassVault</span>
          <nav className="flex gap-5">
            <Link className="underline hover:text-club-ink" href="/legal/terms">
              Terms
            </Link>
            <Link className="underline hover:text-club-ink" href="/legal/privacy">
              Privacy
            </Link>
            <Link
              className="underline hover:text-club-ink"
              href="/legal/takedown"
            >
              Report content
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
