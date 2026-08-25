import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="paper-grain min-h-screen bg-[#f6f1e5]">
      <div className="bg-dotgrid pointer-events-none fixed inset-0" />

      <header className="relative border-b-[1.5px] border-[#171512]/15">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link className="flex items-center gap-2.5" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-[#171512]/25 bg-[#17453a]">
              <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
            </span>
            <span className="font-display text-xl font-black text-[#171512]">
              Class<span className="text-[#f0a202]">Vault</span>
            </span>
          </Link>
          <Link
            className="text-sm font-bold text-[#17453a] underline"
            href="/"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-14">{children}</main>

      <footer className="relative border-t-[1.5px] border-[#171512]/15">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm font-medium text-[#171512]/60">
          <span>© 2026 ClassVault</span>
          <nav className="flex gap-5">
            <Link className="underline hover:text-[#171512]" href="/legal/terms">
              Terms
            </Link>
            <Link
              className="underline hover:text-[#171512]"
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
