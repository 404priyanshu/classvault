'use client'

import { useActionState, useEffect, useState } from 'react'
import { reportStudyRoomParticipantAction } from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'
import type { StudyRoomMessage } from '@/lib/study-rooms/types'
import { StudyRoomActionStatus } from './StudyRoomActionStatus'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

const categories = [
  ['harassment', 'Harassment or bullying'],
  ['hate_speech', 'Hate speech'],
  ['sexual_content', 'Sexual content'],
  ['spam', 'Spam or flooding'],
  ['other', 'Something else'],
] as const

const CITATION_LIMIT = 10

const messageTimeFormat = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
})

/**
 * Reports a participant to platform moderators, not to the host.
 *
 * The host is sometimes the problem, so this deliberately does not tell them a
 * report was filed. Citing messages matters more here than in a note report:
 * the room's chat is deleted when the room ends, so a message a reviewer is not
 * shown is a message they will never be able to read. See ADR 0030.
 */
export function StudyRoomReportForm({
  displayName,
  messages,
  onSuccess,
  roomId,
  userId,
}: {
  displayName: string
  messages: StudyRoomMessage[]
  onSuccess: () => void
  roomId: string
  userId: string
}) {
  const [state, formAction] = useActionState(
    reportStudyRoomParticipantAction,
    initialStudyRoomActionState,
  )
  const [cited, setCited] = useState<number[]>([])

  useEffect(() => {
    if (state.kind === 'success') onSuccess()
  }, [onSuccess, state])

  const atLimit = cited.length >= CITATION_LIMIT

  return (
    <form action={formAction} className="space-y-3">
      <input name="roomId" type="hidden" value={roomId} />
      <input name="userId" type="hidden" value={userId} />

      <div>
        <p className="text-sm font-bold">Report {displayName}</p>
        <p className="mt-1 text-xs leading-relaxed text-club-muted">
          Reports go to ClassVault&rsquo;s platform moderators, not to the room
          host. {displayName} is not told who reported them.
        </p>
      </div>

      <label className="block text-xs font-bold" htmlFor={`room-report-reason-${userId}`}>
        Reason
        <select
          className="mt-1.5 h-10 w-full rounded-xl border border-club-line bg-club-paper px-3 text-sm font-semibold outline-none focus:border-club-purple focus:ring-2 focus:ring-club-purple/15"
          defaultValue="harassment"
          id={`room-report-reason-${userId}`}
          name="category"
        >
          {categories.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {messages.length > 0 ? (
        <fieldset className="rounded-xl border border-club-line bg-club-bg p-3">
          <legend className="px-1 text-xs font-bold">
            Messages to include{' '}
            <span className="font-semibold text-club-muted">
              ({cited.length}/{CITATION_LIMIT})
            </span>
          </legend>
          <p className="mb-2 text-[11px] leading-relaxed text-club-muted">
            Room chat is deleted when the room ends. Anything you tick is copied
            into the report so a reviewer can still read it.
          </p>
          <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {messages.map((message) => {
              const checked = cited.includes(message.id)
              return (
                <label
                  className={`flex gap-2 rounded-lg border border-club-line bg-club-paper px-2.5 py-2 text-xs ${
                    checked ? 'border-club-purple' : ''
                  } ${!checked && atLimit ? 'opacity-55' : ''}`}
                  key={message.id}
                >
                  <input
                    checked={checked}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#4b3b91]"
                    disabled={!checked && atLimit}
                    name="messageIds"
                    onChange={(event) =>
                      setCited((current) =>
                        event.target.checked
                          ? [...current, message.id]
                          : current.filter((id) => id !== message.id),
                      )
                    }
                    type="checkbox"
                    value={message.id}
                  />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold text-club-muted">
                      {messageTimeFormat.format(new Date(message.createdAt))}
                    </span>
                    <span className="mt-0.5 block break-words leading-relaxed">
                      {message.body}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ) : (
        <p className="text-xs text-club-muted">
          {displayName} has not posted in this room, so there is nothing to cite.
        </p>
      )}

      <label className="block text-xs font-bold" htmlFor={`room-report-details-${userId}`}>
        Details <span className="font-semibold text-club-muted">(optional)</span>
        <textarea
          className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-club-line bg-club-paper px-3 py-2 text-sm outline-none placeholder:text-club-muted focus:border-club-purple focus:ring-2 focus:ring-club-purple/15"
          id={`room-report-details-${userId}`}
          maxLength={1000}
          name="details"
          placeholder="What should a moderator know?"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StudyRoomActionStatus state={state} />
        <StudyRoomSubmitButton className="min-h-9 px-3 text-xs" pendingLabel="Sending…">
          Send private report
        </StudyRoomSubmitButton>
      </div>
    </form>
  )
}
