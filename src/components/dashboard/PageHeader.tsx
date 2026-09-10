import type { ReactNode } from 'react'

/**
 * The line that opens a dashboard screen.
 *
 * Each page used to open with a display-sized heading, a two-line paragraph and
 * 28px of padding above a rule -- around 150px before any content, to announce
 * a page whose name the shell's sticky header was already showing. The heading
 * stays, because a screen needs one and a screen reader looks for it, but it is
 * sized for a workspace and it shares its row with whatever the page's main
 * action is.
 */
export function PageHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode
  description?: string
  title: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-club-line pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-[-0.03em]">{title}</h1>
        {description ? (
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-club-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
