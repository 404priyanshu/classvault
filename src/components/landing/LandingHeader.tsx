'use client'

import { useEffect, useState } from 'react'
import { VaultMark } from './VaultMark'
import styles from './Landing.module.css'

const navigation = [
  { label: 'Product', href: '#product' },
  { label: 'Notes', href: '#notes' },
  { label: 'Roadmaps', href: '#roadmaps' },
  { label: 'Study rooms', href: '#rooms' },
  { label: 'Access', href: '#access' },
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  return (
    <header
      className={`${styles.header} ${scrolled || open ? styles.headerActive : ''}`}
    >
      <nav className={styles.headerInner} aria-label="Main navigation">
        <a className={styles.brand} href="#top" aria-label="ClassVault home">
          <VaultMark className={styles.brandMark} />
          <span className={styles.brandName}>CLASSVAULT</span>
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
          <a className={`${styles.button} ${styles.buttonDark} ${styles.signInButton}`} href="/auth/sign-in">
            SIGN IN
          </a>
          <a className={`${styles.button} ${styles.buttonOutline} ${styles.createButton}`} href="/auth/sign-up">
            CREATE ACCOUNT
          </a>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="landing-mobile-navigation"
            onClick={(event) => {
              setOpen((current) => !current)
              if (event.detail > 0) event.currentTarget.blur()
            }}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
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
            CREATE ACCOUNT
          </a>
        </div>
      </div>
    </header>
  )
}
