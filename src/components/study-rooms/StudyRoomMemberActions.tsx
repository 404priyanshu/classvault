'use client'

import { useCallback, useState } from 'react'
import { Flag, MicOff, UserMinus, Volume2, X } from 'lucide-react'
import { useStudyRoomMessages } from './StudyRoomMessages'
import { StudyRoomReasonForm } from './StudyRoomReasonForm'
import { StudyRoomReportForm } from './StudyRoomReportForm'

type Panel = 'mute' | 'remove' | 'report' | null

const pillClass =
  'inline-flex min-h-8 items-center gap-1.5 rounded-full border border-club-line bg-club-paper px-2.5 text-[11px] font-black transition-colors hover:border-club-purple'

/**
 * The per-participant controls a room offers, and nothing more.
 *
 * Reporting is open to every member, because the host is sometimes the person
 * worth reporting. Muting and removing belong to the host and co-hosts, and the
 * parent decides that -- this component is only told whether to draw them.
 */
export function StudyRoomMemberActions({
  displayName,
  isMuted,
  roomId,
  showControls,
  userId,
}: {
  displayName: string
  isMuted: boolean
  roomId: string
  showControls: boolean
  userId: string
}) {
  // Live, not the server snapshot: a message posted since the page loaded is
  // usually the one being reported.
  const messages = useStudyRoomMessages().filter(
    (message) => message.authorId === userId,
  )
  const [panel, setPanel] = useState<Panel>(null)
  const close = useCallback(() => setPanel(null), [])

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {showControls ? (
          <>
            <button
              className={pillClass}
              onClick={() => setPanel('mute')}
              type="button"
            >
              {isMuted ? (
                <Volume2 aria-hidden className="h-3.5 w-3.5 text-club-purple" />
              ) : (
                <MicOff aria-hidden className="h-3.5 w-3.5 text-club-purple" />
              )}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              className={`${pillClass} text-[#9a3328] hover:border-[#9a3328]`}
              onClick={() => setPanel('remove')}
              type="button"
            >
              <UserMinus aria-hidden className="h-3.5 w-3.5" />
              Remove
            </button>
          </>
        ) : null}
        <button
          className={`${pillClass} text-[#9a3f2f] hover:border-[#9a3f2f]`}
          onClick={() => setPanel('report')}
          type="button"
        >
          <Flag aria-hidden className="h-3.5 w-3.5" />
          Report
        </button>
      </div>

      {panel ? (
        <div className="w-full rounded-2xl border border-club-line bg-club-lavender p-4">
          <div className="mb-3 flex justify-end">
            <button
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-full text-club-muted hover:text-club-ink"
              onClick={close}
              type="button"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
          {panel === 'report' ? (
            <StudyRoomReportForm
              displayName={displayName}
              messages={messages}
              onSuccess={close}
              roomId={roomId}
              userId={userId}
            />
          ) : (
            <StudyRoomReasonForm
              displayName={displayName}
              onSuccess={close}
              roomId={roomId}
              userId={userId}
              variant={panel === 'remove' ? 'remove' : isMuted ? 'unmute' : 'mute'}
            />
          )}
        </div>
      ) : null}
    </>
  )
}
