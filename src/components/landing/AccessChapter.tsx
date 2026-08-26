import styles from './Landing.module.css'

const accessRows = [
  {
    viewer: 'SIGNED OUT',
    cells: [
      ['DENIED', 'blocked'],
      ['DENIED', 'blocked'],
      ['PUBLIC ONLY', 'scoped'],
      ['DENIED', 'blocked'],
    ],
  },
  {
    viewer: 'ONBOARDED STUDENT',
    cells: [
      ['READ', 'allowed'],
      ['DENIED', 'blocked'],
      ['SOURCE CHECK', 'scoped'],
      ['PUBLIC', 'allowed'],
    ],
  },
  {
    viewer: 'VERIFIED CAMPUS',
    cells: [
      ['READ', 'allowed'],
      ['READ', 'allowed'],
      ['SOURCE CHECK', 'scoped'],
      ['JOIN', 'allowed'],
    ],
  },
]

const trustDetails = [
  {
    title: 'CAMPUS-SCOPED ACCESS',
    copy: 'A confirmed academic email can verify membership for the selected university; other accounts remain pending.',
  },
  {
    title: 'PRIVATE FILE DELIVERY',
    copy: 'Note assets stay private and are delivered only after an access check through short-lived links.',
  },
  {
    title: 'SCOPED MODERATION',
    copy: 'Reports remain private, while campus and platform moderators see only the queues within their roles.',
  },
  {
    title: 'SHARING THAT RECHECKS',
    copy: 'A shared roadmap never reveals a section when its source is unavailable to that viewer.',
  },
]

export function AccessChapter() {
  return (
    <section id="access" className={styles.accessSection} aria-labelledby="access-title">
      <div className={styles.accessHeader}>
        <div>
          <span className={styles.sectionLabelDark}>ACCESS / PERMISSION LAYER</span>
          <h2 id="access-title">ACCESS IS NOT AN AFTERTHOUGHT.</h2>
        </div>
        <p>
          ClassVault applies student, campus, and source permissions across notes,
          search results, roadmaps, and study rooms.
        </p>
      </div>

      <div className={styles.accessMatrix} role="table" aria-label="ClassVault access examples">
        <div className={`${styles.accessRow} ${styles.accessMatrixHead}`} role="row">
          <span role="columnheader">VIEWER / SURFACE</span>
          <span role="columnheader">PUBLIC NOTE</span>
          <span role="columnheader">CAMPUS NOTE</span>
          <span role="columnheader">SHARED ROADMAP</span>
          <span role="columnheader">CAMPUS ROOM</span>
        </div>
        {accessRows.map((row) => (
          <div key={row.viewer} className={styles.accessRow} role="row">
            <strong role="rowheader">{row.viewer}</strong>
            {row.cells.map(([label, state], index) => (
              <span key={`${label}-${index}`} role="cell" data-state={state}>
                <i aria-hidden /> {label}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.trustGrid}>
        {trustDetails.map((detail, index) => (
          <article key={detail.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{detail.title}</h3>
            <p>{detail.copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
