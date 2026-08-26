import styles from './Landing.module.css'

export type VaultMarkProps = {
  className?: string
  inverted?: boolean
  title?: string
}

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Four folded book pages turn inward to form a vault-like aperture.
 * Supply a title when the mark conveys meaning; omit it for decoration.
 */
export function VaultMark({ className, inverted = false, title }: VaultMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={joinClasses(
        styles.vaultMark,
        inverted && styles.vaultMarkInverted,
        className,
      )}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <path
        className={joinClasses(styles.vaultMarkLeaf, styles.vaultMarkLeafOne)}
        d="M10 6h21l9 9-8 8-7-7h-9v9L6 15v-5a4 4 0 0 1 4-4Z"
        fill="currentColor"
      />
      <path
        className={joinClasses(styles.vaultMarkLeaf, styles.vaultMarkLeafTwo)}
        d="M10 6h21l9 9-8 8-7-7h-9v9L6 15v-5a4 4 0 0 1 4-4Z"
        fill="currentColor"
        transform="rotate(90 32 32)"
      />
      <path
        className={joinClasses(styles.vaultMarkLeaf, styles.vaultMarkLeafThree)}
        d="M10 6h21l9 9-8 8-7-7h-9v9L6 15v-5a4 4 0 0 1 4-4Z"
        fill="currentColor"
        transform="rotate(180 32 32)"
      />
      <path
        className={joinClasses(styles.vaultMarkLeaf, styles.vaultMarkLeafFour)}
        d="M10 6h21l9 9-8 8-7-7h-9v9L6 15v-5a4 4 0 0 1 4-4Z"
        fill="currentColor"
        transform="rotate(270 32 32)"
      />
    </svg>
  )
}

export default VaultMark
