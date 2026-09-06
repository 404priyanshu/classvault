import styles from './Clubhouse.module.css'

const capabilities = [
  ['✳', 'Notes worth opening'],
  ['↗', 'Plans with a starting point'],
  ['◷', 'Focus with company'],
  ['♡', 'A place for your campus'],
]

export function CapabilityRail() {
  return (
    <section className={styles.capabilitySection} aria-labelledby="capability-heading">
      <div className={styles.capabilityIntro}>
        <h2 id="capability-heading">Built for the beautiful chaos of college.</h2>
        <p>Starting with Bennett University. Growing one campus at a time.</p>
      </div>
      <ul className={styles.capabilityList}>
        {capabilities.map(([icon, label]) => <li key={label}><span aria-hidden>{icon}</span>{label}</li>)}
      </ul>
    </section>
  )
}
