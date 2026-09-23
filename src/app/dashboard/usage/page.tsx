import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const EVENTS = [
  { key: 'notes_searched', label: 'Searches' },
  { key: 'note_opened', label: 'Notes opened' },
  { key: 'note_downloaded', label: 'Downloads' },
  { key: 'note_uploaded', label: 'Notes published' },
  { key: 'roadmap_generated', label: 'Roadmaps' },
  { key: 'study_room_joined', label: 'Room joins' },
] as const

type EventKey = (typeof EVENTS)[number]['key']

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  weekday: 'short',
})

const numberFormatter = new Intl.NumberFormat('en-IN')

function formatDay(value: string) {
  // Dates arrive as IST calendar days (yyyy-mm-dd); read them as UTC so the
  // viewer's own time zone cannot shift one onto its neighbour.
  return dayFormatter.format(new Date(`${value}T00:00:00Z`))
}

/** The IST calendar day `days` before today, as yyyy-mm-dd. */
function istDaysAgo(days: number) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date())
  const date = new Date(`${today}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function StatTile({
  detail,
  label,
  value,
}: {
  detail?: string
  label: string
  value: number
}) {
  return (
    <div className="border border-club-line bg-club-paper p-4 [box-shadow:var(--elev-inline)]">
      <p className="text-xs font-bold text-club-muted">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.03em] tabular-nums">
        {numberFormatter.format(value)}
      </p>
      {detail ? (
        <p className="mt-1 text-xs font-medium text-club-muted">{detail}</p>
      ) : null}
    </div>
  )
}

export default async function UsagePage() {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('has_platform_notes_role', {
    accepted_roles: ['platform_admin'],
  })

  // The database refuses these reads for anyone else; this keeps the route
  // from advertising that it exists.
  if (!isAdmin) notFound()

  const [dailyResult, weeklyResult] = await Promise.all([
    supabase.rpc('get_usage_daily', { p_days: 28 }),
    supabase.rpc('get_usage_weekly', { p_weeks: 12 }),
  ])

  if (dailyResult.error || weeklyResult.error) {
    throw new Error('Usage could not be loaded.')
  }

  const daily = dailyResult.data ?? []
  const weekly = weeklyResult.data ?? []

  const byDay = new Map<string, Partial<Record<EventKey, number>> & { empty?: number }>()
  for (const row of daily) {
    const entry = byDay.get(row.day) ?? {}
    entry[row.event as EventKey] = Number(row.events)
    if (row.event === 'notes_searched') {
      entry.empty = Number(row.searches_without_results)
    }
    byDay.set(row.day, entry)
  }
  const days = [...byDay.keys()].sort().reverse()

  const recent = daily.filter((row) => row.day >= istDaysAgo(6))
  const total = (event: EventKey) =>
    recent
      .filter((row) => row.event === event)
      .reduce((sum, row) => sum + Number(row.events), 0)
  const emptySearches = recent.reduce(
    (sum, row) => sum + Number(row.searches_without_results),
    0,
  )
  // usage_weekly_students starts weeks on Monday (date_trunc), in IST.
  const todayIst = new Date(`${istDaysAgo(0)}T00:00:00Z`)
  const currentWeek = istDaysAgo((todayIst.getUTCDay() + 6) % 7)
  const thisWeek = weekly.find((row) => row.week === currentWeek)

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <PageHeader
        description="Counts from the demand pilot, in Indian Standard Time. No search text or personal details are stored, and only administrators can see this page."
        title="Usage"
      />

      {daily.length === 0 && weekly.length === 0 ? (
        <div className="border border-club-line bg-club-paper px-6 py-12 text-center">
          <h2 className="text-lg font-black">No usage recorded yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-club-muted">
            Counts appear here as soon as students search, open, download, or
            publish notes, generate roadmaps, or join study rooms.
          </p>
        </div>
      ) : (
        <>
          <section aria-labelledby="usage-summary-heading">
            <h2 className="sr-only" id="usage-summary-heading">
              Summary
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                detail={
                  thisWeek
                    ? `${numberFormatter.format(Number(thisWeek.returning_students))} returning from earlier weeks`
                    : undefined
                }
                label="Active students this week"
                value={Number(thisWeek?.active_students ?? 0)}
              />
              <StatTile
                detail={`${numberFormatter.format(emptySearches)} found nothing`}
                label="Searches, last 7 days"
                value={total('notes_searched')}
              />
              <StatTile
                detail={`${numberFormatter.format(total('note_downloaded'))} downloaded`}
                label="Notes opened, last 7 days"
                value={total('note_opened')}
              />
              <StatTile
                label="Notes published, last 7 days"
                value={total('note_uploaded')}
              />
            </div>
          </section>

          <section aria-labelledby="usage-weekly-heading">
            <h2 className="text-sm font-black" id="usage-weekly-heading">
              Students by week
            </h2>
            <p className="mt-0.5 text-xs text-club-muted">
              Returning means active this week and in some earlier week.
            </p>
            <div className="mt-3 overflow-x-auto border border-club-line bg-club-paper">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-club-line text-xs text-club-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-bold" scope="col">Week of</th>
                    <th className="px-4 py-2.5 text-right font-bold" scope="col">Active</th>
                    <th className="px-4 py-2.5 text-right font-bold" scope="col">Returning</th>
                  </tr>
                </thead>
                <tbody>
                  {weekly.map((row) => (
                    <tr className="border-b border-club-line last:border-b-0" key={row.week}>
                      <th className="px-4 py-2.5 font-semibold" scope="row">
                        {formatDay(row.week)}
                      </th>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {numberFormatter.format(Number(row.active_students))}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {numberFormatter.format(Number(row.returning_students))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="usage-daily-heading">
            <h2 className="text-sm font-black" id="usage-daily-heading">
              Activity by day
            </h2>
            <p className="mt-0.5 text-xs text-club-muted">
              Days with any activity in the last 28. Repeat opens of the same
              note within ten minutes count once.
            </p>
            <div className="mt-3 overflow-x-auto border border-club-line bg-club-paper">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-club-line text-xs text-club-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-bold" scope="col">Day</th>
                    {EVENTS.map((event) => (
                      <th className="px-4 py-2.5 text-right font-bold" key={event.key} scope="col">
                        {event.label}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-bold" scope="col">
                      Found nothing
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const counts = byDay.get(day) ?? {}
                    return (
                      <tr className="border-b border-club-line last:border-b-0" key={day}>
                        <th className="px-4 py-2.5 font-semibold" scope="row">
                          {formatDay(day)}
                        </th>
                        {EVENTS.map((event) => (
                          <td className="px-4 py-2.5 text-right tabular-nums" key={event.key}>
                            {numberFormatter.format(counts[event.key] ?? 0)}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {numberFormatter.format(counts.empty ?? 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
