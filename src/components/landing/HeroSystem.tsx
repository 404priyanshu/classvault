'use client'

import { useState } from 'react'
import { VaultMark } from './VaultMark'
import styles from './Landing.module.css'

const previews = [
  {
    label: 'Notes', eyebrow: 'OPERATING SYSTEMS / UNIT 03', title: 'The notes you were looking for.',
    description: 'CPU scheduling, without the twenty-message search through the class group.',
    rows: ['Scheduling algorithms', 'Worked examples & diagrams', 'Quick revision questions'],
    footer: 'PDF preview · Public note', href: '/dashboard/notes', action: 'Explore the library',
  },
  {
    label: 'Search', eyebrow: 'YOUR SEARCH / OPERATING SYSTEMS', title: 'Find the useful bit. Faster.',
    description: 'Look inside extractable PDFs as well as titles, subjects, and tags.',
    rows: ['CPU scheduling — Unit 03', 'Deadlocks & worked examples', 'Memory management summary'],
    footer: 'Results follow your access', href: '/dashboard/notes', action: 'Find your next read',
  },
  {
    label: 'Roadmaps', eyebrow: 'REVISION PLAN / OPERATING SYSTEMS', title: 'Know what to study next.',
    description: 'Turn accessible notes into a structured plan, with a source behind every section.',
    rows: ['Start with processes & threads', 'Work through scheduling problems', 'Finish with a revision pass'],
    footer: 'Source-cited · Your progress stays private', href: '/dashboard/roadmaps', action: 'Build a study plan',
  },
  {
    label: 'Rooms', eyebrow: 'STUDY ROOM / DSA REVISION', title: 'A little shared focus.',
    description: 'Meet for a Pomodoro session, follow the same timer, and keep each other going in chat.',
    rows: ['Choose a public or campus room', 'Start a synchronized focus timer', 'Use the room chat to check in'],
    footer: 'Temporary rooms · Shared timer & chat', href: '/dashboard/study-rooms', action: 'Find a study room',
  },
]

export function HeroSystem() {
  const [active, setActive] = useState(0)
  const preview = previews[active]

  return (
    <section id="top" className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.heroEyebrow}><i aria-hidden /> EARLY ACCESS / BENNETT UNIVERSITY</p>
        <h1 className={styles.heroTitle}>
          <span>Less searching.</span>
          <span>More <em>studying.</em></span>
        </h1>
        <p className={styles.heroDescription}>
          Your course notes, a plan to work through them, and people to focus with.
          Finally, in one place.
        </p>
        <div className={styles.heroActions}>
          <a className={`${styles.button} ${styles.buttonDark} ${styles.heroButton}`} href="/auth/sign-up">
            Create your vault <span aria-hidden>↗</span>
          </a>
          <a className={styles.heroTextLink} href="#product">Take a look inside <span aria-hidden>↓</span></a>
        </div>
        <p className={styles.heroSignal}>TRUSTED NOTES. CITED PLANS. SHARED FOCUS.</p>
      </div>

      <div className={styles.systemCanvas} aria-label="Interactive ClassVault product preview">
        <div className={styles.previewTopline}><VaultMark className={styles.previewMark} /><span>YOUR STUDY DESK</span><span>ILLUSTRATIVE PREVIEW</span></div>
        <div className={styles.previewTabs} role="group" aria-label="Choose a study desk preview">
          {previews.map((item, index) => (
            <button key={item.label} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>
              <span>0{index + 1}</span> {item.label}
            </button>
          ))}
        </div>
        <div className={styles.previewPaper} aria-live="polite" aria-atomic="true">
          <span className={styles.previewEyebrow}>{preview.eyebrow}</span>
          <h2>{preview.title}</h2>
          <p>{preview.description}</p>
          <ol className={styles.previewRows}>
            {preview.rows.map((row, index) => <li key={row}><span>0{index + 1}</span>{row}<span aria-hidden>↗</span></li>)}
          </ol>
          <div className={styles.previewFootnote}><span aria-hidden>↳</span> {preview.footer}</div>
        </div>
        <a className={styles.previewAction} href={preview.href}>{preview.action}<span aria-hidden>→</span></a>
      </div>
      <div className={styles.heroBottom}><span>FROM THE FIRST LECTURE TO THE LAST REVISION.</span><a href="#product">Explore ClassVault <span aria-hidden>↓</span></a></div>
    </section>
  )
}
