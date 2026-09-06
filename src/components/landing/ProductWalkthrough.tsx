'use client'

import { useState } from 'react'
import {
  AccessMockup,
  NotesMockup,
  RoadmapMockup,
  RoomMockup,
} from './ProductMockups'
import styles from './Clubhouse.module.css'

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
      'Build a structured study plan from notes you can open, with sources attached to every derived section.',
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
        <h2 id="walkthrough-title">Come on in. Have a look around.</h2>
        <p>
          Notes person? Planner person? Just-here-for-the-study-room person?
          There’s a corner for you. Pick one to peek inside.
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
              tabIndex={active === index ? 0 : -1}
              onKeyDown={(event) => {
                const offsets: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
                const offset = offsets[event.key]
                if (offset === undefined && event.key !== 'Home' && event.key !== 'End') return
                event.preventDefault()
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? surfaces.length - 1 : (index + offset + surfaces.length) % surfaces.length
                setActive(next)
                document.getElementById(`surface-tab-${next}`)?.focus()
              }}
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
          tabIndex={0}
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
      <p className={styles.walkthroughNote}>These previews use example data. Create an account to find real notes, build your own plans, and join a room.</p>
    </section>
  )
}
