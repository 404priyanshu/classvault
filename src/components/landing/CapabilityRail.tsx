import styles from './Landing.module.css'

const capabilities = [
  ['01', 'PERMISSION-SAFE SEARCH'],
  ['02', 'PRIVATE FILE PREVIEWS'],
  ['03', 'SOURCE-CITED ROADMAPS'],
  ['04', 'REALTIME TIMER + CHAT'],
]

export function CapabilityRail() {
  return (
    <section className={styles.capabilitySection} aria-labelledby="capability-heading">
      <div className={styles.sectionGrid}>
        <div className={styles.capabilityIntro}>
          <h2 id="capability-heading">BUILT AROUND HOW COLLEGE ACTUALLY WORKS.</h2>
          <p>
            The useful PDF. The plan for mid-sems. The group that helps you show up.
            Keep the things you need for a semester together.
          </p>
          {/*
            Onboarding offers Bennett and nothing else, so a visitor from another
            campus who is not told that signs up, confirms an email, and stops at
            a university picker with one entry.
          */}
          <p className={styles.capabilityScope}>
            <strong>Open at Bennett University.</strong> One campus at a time —
            ratings only carry signal once enough classmates in a subject have
            left one. Another university opens when its first cohort is ready.
          </p>
        </div>
        <ol className={styles.capabilityList}>
          {capabilities.map(([number, label]) => (
            <li key={number}>
              <span>{number}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
