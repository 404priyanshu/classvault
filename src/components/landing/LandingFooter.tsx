import { VaultMark } from './VaultMark'
import styles from './Clubhouse.module.css'

const footerGroups = [
  {
    title: 'PRODUCT',
    links: [
      ['Notes', '#notes'],
      ['Roadmaps', '#roadmaps'],
      ['Study rooms', '#rooms'],
      ['My Vault', '#vault'],
    ],
  },
  {
    title: 'ACCOUNT',
    links: [
      ['Create account', '/auth/sign-up'],
      ['Sign in', '/auth/sign-in'],
      ['Phone OTP', '/auth/phone'],
      ['Forgot password', '/auth/forgot-password'],
    ],
  },
  {
    title: 'LEGAL',
    links: [
      ['Terms of use', '/legal/terms'],
      ['Privacy policy', '/legal/privacy'],
      ['Report content', '/legal/takedown'],
      ['Contact', 'mailto:hello@priyanshu.co'],
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <section className={styles.finalCta} aria-labelledby="final-cta-title">
        <div className={styles.finalCtaMark}>
          <VaultMark inverted />
        </div>
        <div className={styles.finalCtaCopy}>
          <h2 id="final-cta-title">Your next chapter.<em>Better together.</em></h2>
          <p>Good notes. A little company. A whole lot of possibility.</p>
        </div>
        <div className={styles.finalCtaActions}>
          <a className={`${styles.button} ${styles.buttonLight} ${styles.finalButton}`} href="/auth/sign-up">
            Find your study place <span aria-hidden>→</span>
          </a>
          <a className={styles.finalSignIn} href="/auth/sign-in">Already at home? Log in</a>
        </div>
      </section>

      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <div>
            <VaultMark className={styles.footerMark} inverted />
            <strong>ClassVault</strong>
          </div>
          <p>
            A little corner of the internet for your big college adventure.
          </p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title} className={styles.footerGroup}>
            <h3>{group.title}</h3>
            <ul>
              {group.links.map(([label, href]) => (
                <li key={label}><a href={href}>{label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 CLASSVAULT</span>
        <span>BUILT FOR INDIAN COLLEGE STUDENTS</span>
        <a href="#top">BACK TO TOP ↑</a>
      </div>
    </footer>
  )
}
