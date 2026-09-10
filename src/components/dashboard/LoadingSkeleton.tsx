/**
 * Shared shape for dashboard route transitions.
 *
 * Every dashboard page is `force-dynamic` and waits on several Supabase round
 * trips, so a navigation with no `loading.tsx` shows the previous screen frozen
 * until the new one is ready. That reads as the app hanging. A skeleton in
 * roughly the right shape makes the switch feel immediate and tells the student
 * what is arriving.
 *
 * The pulse is disabled under prefers-reduced-motion by the `.club-workspace`
 * rule in globals.css.
 */
type LoadingSkeletonProps = {
  label: string
  shape?: 'list' | 'grid' | 'panel'
  rows?: number
}

export function LoadingSkeleton({
  label,
  shape = 'list',
  rows = 4,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: rows }, (_, index) => index)

  return (
    <div
      aria-label={label}
      className="mx-auto max-w-[1320px] animate-pulse space-y-7"
      role="status"
    >
      <div className="border-b border-club-line pb-6">
        <div className="h-10 w-56 rounded-lg bg-club-purple/12" />
        <div className="mt-3 h-4 w-full max-w-lg rounded bg-club-ink/10" />
      </div>

      {shape === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              className="h-44 rounded-3xl border border-club-line bg-club-paper"
              key={item}
            />
          ))}
        </div>
      ) : null}

      {shape === 'panel' ? (
        <div className="space-y-5 rounded-3xl border border-club-line bg-club-paper p-6">
          {items.map((item) => (
            <div className="space-y-2" key={item}>
              <div className="h-3 w-28 rounded bg-club-ink/12" />
              <div className="h-11 w-full rounded-xl bg-club-ink/8" />
            </div>
          ))}
        </div>
      ) : null}

      {shape === 'list' ? (
        <div className="overflow-hidden rounded-3xl border border-club-line bg-club-paper">
          {items.map((item) => (
            <div
              className="grid min-h-24 grid-cols-[72px_1fr] gap-5 border-b border-club-line p-5 last:border-b-0"
              key={item}
            >
              <div className="rounded-xl bg-club-purple/10" />
              <div className="space-y-3 py-1">
                <div className="h-3 w-32 rounded bg-club-purple/15" />
                <div className="h-5 w-3/5 rounded bg-club-ink/12" />
                <div className="h-3 w-4/5 rounded bg-club-ink/8" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
