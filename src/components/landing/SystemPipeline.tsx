import styles from './Landing.module.css'

/*
 * The spine of the page is a semester, not a data pipeline.
 *
 * Upload → process → authorize → discover → cite → focus described the system
 * accurately and could have belonged to any product. A term runs on a shape
 * every student already knows, and mid-sem, revision, and previous-year papers
 * are vocabulary nothing outside an Indian college campus uses.
 *
 * Each stage still names a real surface, so the sequence stays a description of
 * what the product does rather than a story about studying. Copy may describe
 * only implemented behaviour.
 */
const term = [
  {
    stage: 'WEEK 01',
    title: 'Notes go up as the unit is taught',
    copy: 'Share a PDF or image up to 10 MiB. Add a subject and tags so classmates can find it later.',
    surface: 'UPLOAD',
  },
  {
    stage: 'UNIT NOTES',
    title: 'The class decides what is worth opening',
    copy: 'Classmate ratings help you choose where to start, with both rating count and recency taken into account.',
    surface: 'RATINGS',
  },
  {
    stage: 'MID-SEM',
    title: 'A plan built only from notes you can open',
    copy: 'Sections cite the notes they came from, and every source is re-checked against your access each time the plan is viewed.',
    surface: 'ROADMAP',
  },
  {
    stage: 'REVISION',
    title: 'Previous-year papers and summaries, scoped to your campus',
    copy: 'Search reads titles, tags, and the text inside the PDF, filtered to what your membership actually permits.',
    surface: 'SEARCH',
  },
  {
    stage: 'END-SEM',
    title: 'Everyone on the same clock',
    copy: 'A shared focus timer, host and co-host roles, and chat that disappears with the room.',
    surface: 'STUDY ROOM',
  },
]

export function SystemPipeline() {
  return (
    <section className={styles.pipelineSection} aria-labelledby="pipeline-title">
      <div className={styles.pipelineHeader}>
        <div>
          <span className={styles.sectionLabel}>ONE TERM, END TO END</span>
          <h2 id="pipeline-title">A SEMESTER, NOT A FOLDER.</h2>
        </div>
        <p>
          From the first uploaded notes to the last group revision session,
          give every part of your semester a place.
        </p>
      </div>

      <ol className={styles.pipelineList}>
        {term.map((step, index) => (
          <li key={step.stage} className={styles.pipelineStep}>
            <span className={styles.pipelineNumber}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className={styles.pipelineNode} aria-hidden>
              <i />
            </div>
            <span className={styles.pipelineStage}>{step.stage}</span>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
            <span className={styles.pipelineSurface}>{step.surface}</span>
          </li>
        ))}
      </ol>

      <div className={styles.pipelineStatus}>
        <span>SOURCE / NOTE_03.PDF</span>
        <span>ACCESS / UNIVERSITY</span>
        <span>OUTPUT / CITED PLAN</span>
      </div>
    </section>
  )
}
