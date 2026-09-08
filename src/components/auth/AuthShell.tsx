import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import clubhouse from '@/assets/study-clubhouse.webp'
import { Brand } from '@/components/ui/Brand'

type AuthShellProps = {
  children: ReactNode
  description: string
  footer?: ReactNode
  title: string
}

/**
 * The auth screens are short, single-purpose forms, so they are built to fit
 * the viewport rather than to be scrolled. The kicker that used to sit above
 * each title is gone: it repeated what the heading already said, and on a
 * 768px laptop it was spending height the form needed.
 */
export function AuthShell({ children, description, footer, title }: AuthShellProps) {
  return (
    <main className="club-auth">
      <section className="club-auth-world" aria-label="Welcome to ClassVault">
        <Brand light />
        <div className="club-auth-welcome">
          <h2>Good notes.<br />Great company.<br /><em>You’ve got this.</em></h2>
          <Image src={clubhouse} alt="Our study crew sharing a cozy clubhouse made of books." sizes="(max-width: 900px) 0px, 50vw" className="club-auth-art" />
          <p>A place for your notes, your plans,<br />and your next little win.</p>
        </div>
        <span className="club-auth-footnote">Starting with Bennett University. Growing together.</span>
      </section>
      <div className="club-auth-form-side">
        <div className="club-auth-mobile-brand"><Brand /></div>
        <section className="club-auth-card">
          <h1>{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-club-muted">{description}</p>
          <div className="mt-5">{children}</div>
          {footer ? <div className="mt-5 border-t border-club-line pt-4 text-center text-sm text-club-muted">{footer}</div> : null}
        </section>
        <nav aria-label="Account legal links" className="club-auth-legal">
          <Link href="/">Back to ClassVault</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
        </nav>
      </div>
    </main>
  )
}
