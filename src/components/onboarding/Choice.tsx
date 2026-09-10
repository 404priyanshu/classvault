import type { ReactNode } from 'react'
import styles from '@/components/journey/Journey.module.css'

export function Choice({
  checked,
  onChange,
  value,
  group,
  label,
  description,
  icon,
}: {
  checked: boolean
  onChange: (value: string) => void
  value: string
  group: string
  label: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <label className={styles.choice}>
      <input
        type="radio"
        name={group}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      {icon ? <span className={styles.choiceIcon}>{icon}</span> : null}
      <span className={styles.choiceCopy}>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className={styles.radio} aria-hidden="true" />
    </label>
  )
}
