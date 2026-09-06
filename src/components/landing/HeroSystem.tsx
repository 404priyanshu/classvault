import Image from 'next/image'
import clubhouse from '@/assets/study-clubhouse.webp'
import styles from './Clubhouse.module.css'

export function HeroSystem() {
  return (
    <section id="top" className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}><i aria-hidden /> Your campus. Your people. Your little head start.</p>
          <h1 className={styles.heroTitle}>
            <span>Good notes.</span>
            <span>Great company.</span>
            <span><em>You’ve got this.</em></span>
          </h1>
          <p className={styles.heroDescription}>
            Less “anyone have the notes?” More getting somewhere together.
            Find your next read, make a study plan, and settle into a focus session with your people.
          </p>
          <div className={styles.heroActions}>
            <a className={`${styles.button} ${styles.heroButton}`} href="/auth/sign-up">
              Find your study place <span aria-hidden>↗</span>
            </a>
            <a className={styles.heroTextLink} href="#product">Take a peek <span aria-hidden>↓</span></a>
          </div>
          <p className={styles.heroSignal}>Early access at Bennett University. Come make yourself at home.</p>
        </div>
        <div className={styles.heroWorld}>
          <Image className={styles.heroArt} src={clubhouse} alt="An owl with headphones, a mint study buddy, and a smiling star sharing a cozy clubhouse made of books." sizes="(max-width: 800px) 100vw, 58vw" preload />
          <div className={styles.heroSticker} aria-hidden>Big<br />study-buddy<br />energy.</div>
          <div className={styles.heroChat}>
            <span aria-hidden>✳</span>
            <div><strong>Room for one more? Always.</strong><p>Your next study session starts here.</p></div>
          </div>
        </div>
        <span className={styles.heroDoodle} aria-hidden>✧</span>
      </div>
      <div className={styles.heroBottom}>Share a little knowledge <span aria-hidden>✳</span> Find a little focus <span aria-hidden>✳</span> Make a little progress</div>
    </section>
  )
}
