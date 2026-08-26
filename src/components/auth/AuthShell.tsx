import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
  description: string
  eyebrow: string
  footer?: ReactNode
  title: string
}

export function AuthShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: AuthShellProps) {
  return (
    <main className="paper-grain relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f1e5] px-5 py-12 text-[#171512]">
      <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-70" />
      <div className="absolute left-[8%] top-[12%] h-28 w-28 rotate-[-8deg] rounded-full border-[1.5px] border-dashed border-[#17453a]/30" />
      <div className="absolute bottom-[10%] right-[8%] h-20 w-40 rotate-[5deg] bg-[#f0a202]/25" />

      <section className="paper-card relative z-10 w-full max-w-md bg-[#fffdf6] p-7 sm:p-9">
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#171512]/22 bg-[#17453a] [box-shadow:var(--elev-inline)]">
            <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
          </span>
          <span className="font-display text-xl font-black">
            Class<span className="text-[#17453a]">Vault</span>
          </span>
        </Link>

        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#17453a]">
          {eyebrow}
        </p>
        <h1 className="font-display mt-2 text-4xl font-black leading-tight">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#171512]/65">
          {description}
        </p>

        <div className="mt-7">{children}</div>

        {footer ? (
          <div className="mt-7 border-t-[1.5px] border-dashed border-[#171512]/20 pt-5 text-center text-sm text-[#171512]/65">
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  )
}
