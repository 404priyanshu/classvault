import { ClubhouseRoom } from './ClubhouseRoom'
import styles from './Clubhouse.module.css'

function NotesVisual() {
  return (
    <>
      <div className={styles.noteCard}>
        <div className={styles.noteCardTop}><span>PDF</span> Operating Systems · Unit 03</div>
        <h4>CPU scheduling,<br />minus the confusion.</h4>
        <p>Diagrams. Worked examples. The useful stuff.</p>
        <div className={styles.noteLines} aria-hidden><i /><i /><i /><i /></div>
        <span className={styles.noteTag}>✓ A little help from your classmates</span>
      </div>
      <span className={styles.noteSticker} aria-hidden>saved your scroll ♡</span>
      <span className={styles.visualCaption}>Illustrative note preview</span>
    </>
  )
}

function RoadmapVisual() {
  return (
    <>
      <div className={styles.planCard}>
        <div className={styles.planCardTop}><span>YOUR REVISION PLAN</span><span aria-hidden>✦</span></div>
        <h4>One thing at a time.</h4>
        <div className={styles.planTasks}>
          <div><b>✓</b><span>Get the basics down<small>Processes & threads · Source 01</small></span></div>
          <div><b>02</b><span>Try a worked example<small>CPU scheduling · Source 02</small></span></div>
          <div><b>03</b><span>Give yourself a quick recap<small>Revision questions · Source 01</small></span></div>
        </div>
        <div className={styles.planProgress}><i aria-hidden /><span>1 of 3 done. Nice.</span></div>
      </div>
      <span className={styles.visualCaption}>Illustrative roadmap preview</span>
    </>
  )
}

const chapters = [
  { id: 'notes', label: '01 / PASS THE GOOD NOTES', title: 'The group chat scroll ends here.', copy: 'Good notes deserve better than getting buried under “which classroom?” Find PDFs, summaries, and previous-year papers by subject. Preview them, check peer ratings, and get to the good part.', action: 'Find your next read', href: '/dashboard/notes', visual: NotesVisual },
  { id: 'roadmaps', label: '02 / SMALL STEPS, REAL PROGRESS', title: 'Big syllabus. Meet little steps.', copy: 'That “where do I even start?” feeling? Give it a plan. Turn notes you can access into a study roadmap, follow the sources, and tick things off at your own pace.', action: 'Make a study plan', href: '/dashboard/roadmaps', visual: RoadmapVisual },
  { id: 'rooms', label: '03 / BETTER WITH A STUDY BUDDY', title: 'Same timer. Your kind of company.', copy: 'Pull up a chair in a public or campus study room. Settle into a shared Pomodoro session, check in through chat, and keep each other going. Even on the “just five more minutes” days.', action: 'Find a study room', href: '/dashboard/study-rooms', visual: ClubhouseRoom },
]

export function ProductChapters() {
  return (
    <section className={styles.chaptersSection} aria-labelledby="chapters-title">
      <div className={styles.chaptersHeading}>
        <span className={styles.eyebrow}>A little less chaos. A lot more you.</span>
        <h2 id="chapters-title">College is a lot.<br /><em>Don’t do it all alone.</em></h2>
        <p>A home for the notes, plans, and people that help you get through it. From first lecture to final revision.</p>
      </div>
      <div className={styles.chapterGrid}>
        {chapters.map((chapter) => {
          const Visual = chapter.visual
          return (
            <article key={chapter.id} id={chapter.id} className={styles.chapter}>
              <div className={styles.chapterVisual}><Visual /></div>
              <div className={styles.chapterCopy}>
                <span className={styles.chapterLabel}>{chapter.label}</span>
                <h3>{chapter.title}</h3>
                <p>{chapter.copy}</p>
                <a href={chapter.href}>{chapter.action}<span aria-hidden>↗</span></a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
