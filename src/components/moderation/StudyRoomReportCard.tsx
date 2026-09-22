import {
  CircleSlash,
  DoorClosed,
  Flag,
  MessageSquareQuote,
  Radio,
  ShieldAlert,
} from 'lucide-react'
import {
  reviewStudyRoomReportAction,
  suspendReportedParticipantAction,
} from '@/app/dashboard/moderation/actions'

export type StudyRoomReportItem = {
  category: string
  cited_messages: unknown
  created_at: string
  details: string
  report_id: string
  reported_label: string
  reported_suspended: boolean
  reporter_label: string
  review_note: string
  reviewed_at: string | null
  reviewer_label: string | null
  room_name: string
  room_still_live: boolean
  status: string
}

type CitedMessage = {
  authorDisplayName: string
  body: string
  position: number
  sentAt: string
}

const categoryLabels: Record<string, string> = {
  harassment: 'Harassment or bullying',
  hate_speech: 'Hate speech',
  other: 'Something else',
  sexual_content: 'Sexual content',
  spam: 'Spam or flooding',
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
})

/**
 * Reads the cited messages the queue function packed into one jsonb column.
 *
 * Parsed defensively rather than cast: these are message bodies a student wrote
 * and a reporter chose, and the shape reaching this card decides what a
 * reviewer reads. A malformed row should cost its own card, not the queue.
 */
function citedMessages(value: unknown): CitedMessage[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (
      typeof record.authorDisplayName !== 'string' ||
      typeof record.body !== 'string' ||
      typeof record.position !== 'number' ||
      typeof record.sentAt !== 'string'
    ) {
      return []
    }
    return [record as CitedMessage]
  })
}

export function StudyRoomReportCard({
  canSuspend,
  item,
}: {
  canSuspend: boolean
  item: StudyRoomReportItem
}) {
  const cited = citedMessages(item.cited_messages)

  return (
    <article className="rounded-3xl border border-club-line bg-club-paper p-5 [box-shadow:var(--elev-inline)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#9a3f2f]">
            <span className="inline-flex items-center gap-1.5">
              <Flag aria-hidden className="h-3.5 w-3.5" />
              {categoryLabels[item.category] || item.category}
            </span>
            <span aria-hidden className="text-club-ink/25">/</span>
            <span className="text-club-muted">{item.status}</span>
          </div>
          <h3 className="font-display mt-2 text-2xl font-black leading-tight">
            {item.room_name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-club-muted">
            <span>Reported {dateFormatter.format(new Date(item.created_at))}</span>
            <span>by {item.reporter_label}</span>
            <span className="font-bold text-club-ink/80">
              about {item.reported_label}
            </span>
            {item.reported_suspended ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff2ef] px-2 py-0.5 font-black text-[#9a3328]">
                <CircleSlash aria-hidden className="h-3 w-3" />
                Account suspended
              </span>
            ) : null}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-club-line bg-club-lavender px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-club-muted">
          {item.room_still_live ? (
            <>
              <Radio aria-hidden className="h-3.5 w-3.5 text-[#2d7c58]" />
              Room live
            </>
          ) : (
            <>
              <DoorClosed aria-hidden className="h-3.5 w-3.5" />
              Room ended
            </>
          )}
        </span>
      </div>

      {item.details ? (
        <blockquote className="mt-5 border-l-2 border-club-yellow bg-club-lavender px-4 py-3 text-sm leading-relaxed text-club-muted">
          {item.details}
        </blockquote>
      ) : null}

      <section className="mt-5">
        <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-club-muted">
          <MessageSquareQuote aria-hidden className="h-3.5 w-3.5" />
          Messages the reporter cited
        </h4>
        {cited.length > 0 ? (
          <>
            <ul className="mt-3 space-y-2">
              {cited.map((message) => (
                <li
                  className="rounded-xl border border-club-line bg-club-bg px-3.5 py-2.5"
                  key={message.position}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-[11px] font-bold text-club-muted">
                    <span>{message.authorDisplayName}</span>
                    <time>{dateFormatter.format(new Date(message.sentAt))}</time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.body}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-club-muted">
              The reporter chose these. The rest of the room&rsquo;s chat was
              deleted with the room and cannot be recovered.
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-club-muted">
            No messages were cited, and the room&rsquo;s chat is gone. This
            report can only be judged on its description.
          </p>
        )}
      </section>

      {item.reviewer_label && item.reviewed_at ? (
        <p className="mt-5 text-xs leading-relaxed text-club-muted">
          Last touched by {item.reviewer_label} on{' '}
          {dateFormatter.format(new Date(item.reviewed_at))}
          {item.review_note ? `: ${item.review_note}` : null}
        </p>
      ) : null}

      <form
        action={reviewStudyRoomReportAction}
        className="mt-5 grid gap-3 border-t border-club-line pt-5 sm:grid-cols-2 lg:grid-cols-[160px_minmax(0,1fr)_auto]"
      >
        <input name="reportId" type="hidden" value={item.report_id} />
        <label className="sr-only" htmlFor={`room-report-status-${item.report_id}`}>
          Review state
        </label>
        <select
          className="h-10 rounded-full border border-club-line bg-club-lavender px-2 text-xs font-bold outline-none focus:border-club-purple"
          defaultValue={item.status === 'reviewing' ? 'closed' : 'reviewing'}
          id={`room-report-status-${item.report_id}`}
          name="status"
        >
          <option value="reviewing">Take under review</option>
          <option value="closed">Close report</option>
        </select>
        <label className="sr-only" htmlFor={`room-report-note-${item.report_id}`}>
          What you decided
        </label>
        <input
          className="h-10 rounded-full border border-club-line bg-club-lavender px-3 text-xs outline-none placeholder:text-club-muted focus:border-club-purple"
          id={`room-report-note-${item.report_id}`}
          maxLength={1000}
          name="reviewNote"
          placeholder="What you decided (required to close)"
        />
        <button
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-club-purple bg-club-purple px-3 text-xs font-black text-club-paper [box-shadow:var(--elev-inline)] hover:-translate-y-0.5"
          type="submit"
        >
          <ShieldAlert aria-hidden className="h-3.5 w-3.5" />
          Save
        </button>
      </form>

      {canSuspend && !item.reported_suspended ? (
        <form
          action={suspendReportedParticipantAction}
          className="mt-4 grid gap-3 border-t border-dashed border-club-line pt-4 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <input name="reportId" type="hidden" value={item.report_id} />
          <label className="sr-only" htmlFor={`room-suspend-${item.report_id}`}>
            Reason for suspending the reported participant
          </label>
          <input
            className="h-10 rounded-full border border-[#9a3328]/40 bg-[#fff2ef] px-3 text-xs outline-none placeholder:text-club-muted focus:border-[#9a3328]"
            id={`room-suspend-${item.report_id}`}
            maxLength={500}
            name="reason"
            placeholder="Why this account's access is being suspended"
            required
          />
          <button
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#9a3328] bg-[#fff2ef] px-3 text-xs font-black text-[#9a3328] hover:-translate-y-0.5"
            type="submit"
          >
            <CircleSlash aria-hidden className="h-3.5 w-3.5" />
            Suspend account
          </button>
        </form>
      ) : null}
    </article>
  )
}
