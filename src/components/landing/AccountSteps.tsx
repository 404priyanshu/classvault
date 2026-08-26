import styles from './Landing.module.css'

const steps = [
  {
    title: 'SIGN IN YOUR WAY',
    copy: 'Use email and password, Google, GitHub, or phone OTP.',
    meta: 'AUTH / 04 METHODS',
  },
  {
    title: 'ADD ACADEMIC CONTEXT',
    copy: 'Choose your degree, graduation year, university, goal, and study preference.',
    meta: 'PROFILE / ONCE',
  },
  {
    title: 'OPEN THE VAULT',
    copy: 'Use notes, roadmaps, rooms, and settings from one protected dashboard.',
    meta: 'SYSTEM / READY',
  },
]

export function AccountSteps() {
  return (
    <section className={styles.accountSection} aria-labelledby="account-title">
      <div className={styles.accountIntro}>
        <span className={styles.sectionLabel}>ACCOUNT LAYER</span>
        <h2 id="account-title">SET UP ONCE. STUDY ACROSS THE SYSTEM.</h2>
        <p>
          Your account carries identity and academic context into every protected
          ClassVault surface.
        </p>
      </div>

      <ol className={styles.accountList}>
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className={styles.accountNumber}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </div>
            <small>{step.meta}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}
