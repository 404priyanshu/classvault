import styles from './Landing.module.css'

function NotesVisual() {
  return (
    <div className={styles.chapterVisualInner}>
      <div className={styles.chapterWindowBar}><span /><span>NOTES / LIBRARY</span><span>⌘K</span></div>
      <div className={styles.notesSearch}>operating systems <span>03 RESULTS</span></div>
      <div className={styles.notesMiniList}>
        {[
          ['CPU Scheduling — Unit 03', '4.6', 'PUBLIC'],
          ['Deadlocks + Worked Examples', '4.4', 'CAMPUS'],
          ['Memory Management Summary', '4.2', 'PUBLIC'],
        ].map(([title, rating, scope], index) => (
          <div key={title} className={index === 0 ? styles.miniRowActive : ''}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{title}</strong>
            <span>★ {rating}</span>
            <em>{scope}</em>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoadmapVisual() {
  return (
    <div className={styles.chapterVisualInner}>
      <div className={styles.chapterWindowBar}><span /><span>ROADMAP / OPERATING SYSTEMS</span><span>62%</span></div>
      <div className={styles.roadmapMini}>
        {[
          ['01', 'Foundations', 'SOURCE 02', true],
          ['02', 'Processes + threads', 'SOURCE 01', true],
          ['03', 'Memory management', 'SOURCE 03', false],
          ['04', 'Revision pass', 'SOURCE 02', false],
        ].map(([number, title, source, done]) => (
          <div key={String(number)}>
            <span className={done ? styles.miniComplete : ''}>{done ? '✓' : number}</span>
            <strong>{title}</strong>
            <em>{source}</em>
          </div>
        ))}
      </div>
      <div className={styles.sourceTrace}><span>SOURCES</span><i /><b>01</b><i /><b>02</b><i /><b>03</b></div>
    </div>
  )
}

function RoomVisual() {
  return (
    <div className={`${styles.chapterVisualInner} ${styles.roomVisual}`}>
      <div className={styles.chapterWindowBar}><span className={styles.liveIndicator} /><span>ROOM / DSA REVISION</span><span>04 MEMBERS</span></div>
      <time>24:59</time>
      <div className={styles.timerTrack}><i /></div>
      <div className={styles.roomControls}><span>HOST / ARJUN_17</span><span>FOCUS</span><span>REV / 18</span></div>
      <div className={styles.chatLines}>
        <p><b>MEERA_08</b> starting graphs after this block</p>
        <p><b>ARJUN_17</b> timer is synced</p>
      </div>
    </div>
  )
}

function VaultVisual() {
  return (
    <div className={styles.chapterVisualInner}>
      <div className={styles.chapterWindowBar}><span /><span>MY VAULT / LIFECYCLE</span><span>OWNER</span></div>
      <div className={styles.lifecycleGraph}>
        {['DRAFT', 'VERIFY', 'READY', 'TRASH', 'RESTORE'].map((label, index) => (
          <div key={label}>
            <span className={index === 2 ? styles.lifecycleActive : ''}>{String(index + 1).padStart(2, '0')}</span>
            <strong>{label}</strong>
            {index < 4 && <i aria-hidden />}
          </div>
        ))}
      </div>
      <p className={styles.lifecycleNote}>TRASH / RECOVERABLE FOR 30 DAYS</p>
    </div>
  )
}

const chapters = [
  {
    id: 'notes',
    number: '01 / KNOWLEDGE LAYER',
    title: "FIND WHAT YOU NEED. KNOW WHAT YOU'RE OPENING.",
    copy: 'Search titles, tags, subjects, and extractable PDF text. Filter by type, access, recency, or rating, then preview files privately.',
    support: 'Pseudonymous contributors. Recency-aware peer ratings. Scoped reporting and moderation.',
    href: '/dashboard/notes',
    action: 'OPEN NOTES',
    visual: NotesVisual,
  },
  {
    id: 'roadmaps',
    number: '02 / PLANNING LAYER',
    title: 'A STUDY PLAN THAT SHOWS ITS SOURCES.',
    copy: 'Choose a topic and study mode. ClassVault selects notes you can read, builds cited sections and tasks, and withholds a section if its source becomes unavailable.',
    support: 'Private task progress. Revocable sharing. Permission checks on every view.',
    href: '/dashboard/roadmaps',
    action: 'BUILD A ROADMAP',
    visual: RoadmapVisual,
  },
  {
    id: 'rooms',
    number: '03 / FOCUS LAYER',
    title: 'START TOGETHER. STAY IN SYNC.',
    copy: 'Create or join a temporary public or campus room with a synchronized Pomodoro timer, member roles, and room-scoped chat.',
    support: 'Host responsibility can transfer when the original host leaves.',
    href: '/dashboard/study-rooms',
    action: 'FIND A ROOM',
    visual: RoomVisual,
  },
  {
    id: 'vault',
    number: '04 / LIFECYCLE LAYER',
    title: 'YOUR FILES HAVE A WAY BACK.',
    copy: 'Track active uploads, soft-delete notes, restore them from Trash, and keep publication state visible from one owner-only view.',
    support: 'Private storage. Exact-object authorization. A 30-day recovery window.',
    href: '/dashboard/vault',
    action: 'OPEN MY VAULT',
    visual: VaultVisual,
  },
]

export function ProductChapters() {
  return (
    <section className={styles.chaptersSection} aria-labelledby="chapters-title">
      <div className={styles.chaptersHeading}>
        <h2 id="chapters-title">BUILD YOUR STUDY SYSTEM.</h2>
        <p>
          Every layer is useful on its own. Together, they turn course material into
          something you can actually finish.
        </p>
      </div>
      <div className={styles.chapterGrid}>
        {chapters.map((chapter) => {
          const Visual = chapter.visual
          return (
            <article key={chapter.id} id={chapter.id} className={styles.chapter}>
              <div className={styles.chapterVisual}><Visual /></div>
              <span className={styles.sectionLabel}>{chapter.number}</span>
              <h3>{chapter.title}</h3>
              <p>{chapter.copy}</p>
              <small>{chapter.support}</small>
              <a href={chapter.href}>{chapter.action} <span aria-hidden>→</span></a>
            </article>
          )
        })}
      </div>
    </section>
  )
}
