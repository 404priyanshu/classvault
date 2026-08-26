import styles from './Landing.module.css'

const pipeline = [
  {
    title: 'Upload',
    copy: 'PDF, JPEG, PNG, or WebP files up to 25 MiB.',
  },
  {
    title: 'Process',
    copy: 'File type, size, and checksum are checked before publication.',
  },
  {
    title: 'Authorize',
    copy: 'Public access or a current verified campus membership.',
  },
  {
    title: 'Discover',
    copy: 'Search metadata and extractable PDF text.',
  },
  {
    title: 'Cite',
    copy: 'Roadmap sections keep their source notes attached.',
  },
  {
    title: 'Focus',
    copy: 'Use a synchronized timer, member roles, and temporary chat.',
  },
]

export function SystemPipeline() {
  return (
    <section className={styles.pipelineSection} aria-labelledby="pipeline-title">
      <div className={styles.pipelineHeader}>
        <div>
          <span className={styles.sectionLabel}>THE CLASSVAULT PIPELINE</span>
          <h2 id="pipeline-title">FILES IN. FOCUS OUT.</h2>
        </div>
        <p>
          Course material moves through one permission-aware path—from upload to
          discovery, planning, and focused study.
        </p>
      </div>

      <ol className={styles.pipelineList}>
        {pipeline.map((step, index) => (
          <li key={step.title} className={styles.pipelineStep}>
            <span className={styles.pipelineNumber}>{String(index + 1).padStart(2, '0')}</span>
            <div className={styles.pipelineNode} aria-hidden>
              <i />
            </div>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
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
