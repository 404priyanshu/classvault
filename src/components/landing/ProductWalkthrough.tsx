'use client'

import { useState } from 'react'
import {
  AccessMockup,
  NotesMockup,
  RoadmapMockup,
  RoomMockup,
} from './ProductMockups'
import styles from './Landing.module.css'

const surfaces = [
  {
    title: 'Notes',
    description:
      'Search titles, subjects, tags, and extractable PDF text. Preview private files and sort by real peer ratings.',
    component: NotesMockup,
  },
  {
    title: 'Roadmaps',
    description:
      'Build a deterministic study plan from notes you can open, with sources attached to every derived section.',
    component: RoadmapMockup,
  },
  {
    title: 'Study rooms',
    description:
      'Run a synchronized Pomodoro timer with member roles and temporary room-scoped chat.',
    component: RoomMockup,
  },
  {
    title: 'Access',
    description:
      'Recheck student, campus, owner, and source permissions at the moment content is viewed.',
    component: AccessMockup,
  },
]

export function ProductWalkthrough() {
  const [active, setActive] = useState(0)
  const ActiveMockup = surfaces[active].component

  return (
    <section id="product" className={styles.walkthroughSection} aria-labelledby="walkthrough-title">
      <div className={styles.sectionHeadingCentered}>
        <h2 id="walkthrough-title">ONE ACCOUNT. EVERY STUDY SURFACE.</h2>
        <p>
          Notes, plans, and focus sessions share one permission-aware system, so each step
          starts with the context from the last.
        </p>
      </div>

      <div className={styles.walkthroughGrid}>
        <div className={styles.surfaceTabs} role="tablist" aria-label="ClassVault product surfaces">
          {surfaces.map((surface, index) => (
            <button
              key={surface.title}
              type="button"
              role="tab"
              id={`surface-tab-${index}`}
              aria-selected={active === index}
              aria-controls="surface-panel"
              className={`${styles.surfaceTab} ${active === index ? styles.surfaceTabActive : ''}`}
              onClick={(event) => {
                setActive(index)
                if (event.detail > 0) event.currentTarget.blur()
              }}
            >
              <span className={styles.surfaceIndex}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.surfaceTabCopy}>
                <strong>{surface.title}</strong>
                <span>{surface.description}</span>
              </span>
              <span className={styles.surfaceArrow} aria-hidden>↗</span>
            </button>
          ))}
        </div>

        <div
          key={active}
          id="surface-panel"
          role="tabpanel"
          aria-labelledby={`surface-tab-${active}`}
          className={styles.walkthroughStage}
        >
          <div className={styles.stageHeader}>
            <span>CLASSVAULT / {surfaces[active].title.toUpperCase()}</span>
            <span><i /> DEMO DATA</span>
          </div>
          <ActiveMockup />
        </div>
      </div>
    </section>
  )
}
