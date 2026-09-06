'use client'

import { useEffect, useRef, useState } from 'react'
import { VaultMark } from './VaultMark'
import styles from './Clubhouse.module.css'

const navigation = [
  { label: 'Product', href: '#product' },
  { label: 'Notes', href: '#notes' },
  { label: 'Roadmaps', href: '#roadmaps' },
  { label: 'Study rooms', href: '#rooms' },
  { label: 'Good to know', href: '#access' },
]

export function LandingHeader() {
  const menuRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  return (
    <header
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          menuRef.current?.focus()
        }
      }}
      className={styles.header}
    >
      <nav className={styles.headerInner} aria-label="Main navigation">
        <a className={styles.brand} href="#top" aria-label="ClassVault home">
          <VaultMark className={styles.brandMark} />
          <span className={styles.brandName}>ClassVault</span>
          <span className={styles.brandDescriptor}>/ STUDY SYSTEM</span>
        </a>

        <div className={styles.desktopNav}>
          {navigation.map((item) => (
            <a key={item.href} className={styles.navLink} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>

        <div className={styles.headerActions}>
          <a className={`${styles.button} ${styles.buttonOutline} ${styles.signInButton}`} href="/auth/sign-in">
            Log in
          </a>
          <a className={`${styles.button} ${styles.buttonDark} ${styles.createButton}`} href="/auth/sign-up">
            Join ClassVault
          </a>
          <button
            ref={menuRef}
            type="button"
            className={styles.menuButton}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="landing-mobile-navigation"
            onClick={() => setOpen((current) => !current)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        inert={!open}
        id="landing-mobile-navigation"
        className={`${styles.mobileNav} ${open ? styles.mobileNavOpen : ''}`}
      >
        <div className={styles.mobileNavInner}>
          {navigation.map((item, index) => (
            <a
              key={item.href}
              className={styles.mobileNavLink}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          ))}
          <a
            className={`${styles.button} ${styles.buttonSignal} ${styles.mobileAccountButton}`}
            href="/auth/sign-up"
            onClick={() => setOpen(false)}
          >
            Join ClassVault
          </a>
        </div>
      </div>
    </header>
  )
}
