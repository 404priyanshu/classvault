import styles from './Clubhouse.module.css'

export function AccountSteps() {
  return (
    <section className={styles.accountSection} aria-labelledby="account-title">
      <div className={styles.accountIntro}>
        <span className={styles.eyebrow}>Your seat is right here</span>
        <h2 id="account-title">New here? You’ll fit right in.</h2>
        <p>Bring your syllabus, your curiosity, or just your “I should probably start studying” energy.</p>
      </div>
      <ol className={styles.accountList}>
        {['Create your account', 'Find your campus', 'Make yourself at home'].map((step, index) => (
          <li key={step}><span className={styles.accountNumber}>{index + 1}</span><h3>{step}</h3></li>
        ))}
      </ol>
      <div className={styles.accountAction}><a className={`${styles.button} ${styles.buttonDark}`} href="/auth/sign-up">Let’s get you settled <span aria-hidden>↗</span></a></div>
    </section>
  )
}
