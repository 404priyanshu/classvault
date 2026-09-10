import type { ReactNode } from 'react'
import Link from 'next/link'
import { Brand } from '@/components/ui/Brand'
import { PencilGuide, type PencilMood } from './PencilGuide'
import styles from './Journey.module.css'

export function JourneyShell({
  children,
  mood = 'welcome',
  message = 'Your campus. Your pace.',
  title = (
    <>
      A little about you.
      <br />A better place to study.
    </>
  ),
  account = false,
  variant,
}: {
  children: ReactNode
  mood?: PencilMood
  message?: string
  title?: ReactNode
  account?: boolean
  variant?: 'signup'
}) {
  return (
    <main className={`${styles.ground} ${variant ? styles[`${variant}Ground`] : ''}`}>
      <header className={styles.header}>
        <Brand href="/" />
        {account ? (
          <p>
            Already a member? <Link href="/auth/sign-in">Sign in</Link>
          </p>
        ) : (
          <p>Your student setup</p>
        )}
      </header>
      <div className={`${styles.shell} ${variant ? styles[`${variant}Shell`] : ''}`}>
        <aside className={`${styles.world} ${variant ? styles[`${variant}World`] : ''}`}>
          <h2>{title}</h2>
          <div className={styles.character}>
            <PencilGuide mood={mood} />
          </div>
          <p className={styles.guideMessage} aria-live="polite">
            {message}
          </p>
        </aside>
        <section className={`${styles.surface} ${variant ? styles[`${variant}Surface`] : ''}`}>
          {children}
        </section>
      </div>
      <footer className={styles.pageFooter}>
        <span>A little setup. A fresh start.</span>
        <nav aria-label="Legal">
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  )
}
