import type { ReactNode } from 'react'
import { JourneyShell } from './JourneyShell'
import styles from './Journey.module.css'

export function JourneyCheckpoint({
  children,
  description,
  footer,
  title,
}: {
  children: ReactNode
  description: string
  footer: ReactNode
  title: string
}) {
  return (
    <JourneyShell
      mood="thinking"
      title={
        <>
          A small check.
          <br />A fresh start.
        </>
      }
      message="We’ll meet you on the other side."
    >
      <h1 className={styles.heading}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={`${styles.fields} ${styles.checkpoint}`}>{children}</div>
      <div className={styles.actions}>{footer}</div>
    </JourneyShell>
  )
}
