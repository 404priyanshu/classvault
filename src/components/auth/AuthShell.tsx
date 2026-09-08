import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import clubhouse from '@/assets/study-clubhouse.webp'
import { Brand } from '@/components/ui/Brand'

type AuthShellProps = {
  children: ReactNode
  description: string
  eyebrow: string
  footer?: ReactNode
  title: string
}

export function AuthShell({ children, description, eyebrow, footer, title }: AuthShellProps) {
  return (
    <main className="club-auth">
      <section className="club-auth-world" aria-label="Welcome to ClassVault">
        <Brand light />
        <div className="club-auth-welcome">
          <span className="club-eyebrow">Your little corner of campus</span>
          <h2>Good notes.<br />Great company.<br /><em>You’ve got this.</em></h2>
          <Image src={clubhouse} alt="Our study crew sharing a cozy clubhouse made of books." sizes="(max-width: 900px) 0px, 50vw" className="club-auth-art" />
          <p>A place for your notes, your plans,<br />and your next little win.</p>
        </div>
        <span className="club-auth-footnote">Starting with Bennett University. Growing together.</span>
      </section>
      <div className="club-auth-form-side">
        <div className="club-auth-mobile-brand"><Brand /></div>
        <section className="club-auth-card">
          <p className="club-eyebrow text-club-purple">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-club-muted">{description}</p>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-7 border-t border-club-line pt-5 text-center text-sm text-club-muted">{footer}</div> : null}
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
