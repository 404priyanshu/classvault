'use client'

import { useActionState, useEffect, useState } from 'react'
import { Pause, Play, RefreshCcw, SkipForward } from 'lucide-react'
import { updateStudyRoomTimerAction } from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'
import { formatTimerSeconds } from '@/lib/study-rooms/types'
import { StudyRoomActionStatus } from './StudyRoomActionStatus'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

export function StudyRoomTimer({
  canControl,
  initialRemainingSeconds,
  roomId,
  timerPhase,
  timerRevision,
  timerStatus,
}: {
  canControl: boolean
  initialRemainingSeconds: number
  roomId: string
  timerPhase: 'focus' | 'break'
  timerRevision: number
  timerStatus: 'paused' | 'running'
}) {
  const [seconds, setSeconds] = useState(initialRemainingSeconds)
  const [state, formAction] = useActionState(
    updateStudyRoomTimerAction,
    initialStudyRoomActionState,
  )

  useEffect(() => {
    if (timerStatus !== 'running') return
    const interval = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timerStatus])

  return (
    <div className="text-center">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#17453a]">
        {timerPhase === 'focus' ? 'Focus block' : 'Break block'}
      </p>
      <p
        aria-live="off"
        className="font-display mt-3 tabular-nums text-[clamp(4.5rem,12vw,8.5rem)] font-black leading-[0.86] tracking-[-0.06em] text-[#171512]"
      >
        {formatTimerSeconds(seconds)}
      </p>
      <p className="mt-4 text-sm font-semibold text-[#171512]/55">
        {seconds === 0
          ? 'Block complete — move to the next phase when everyone is ready.'
          : timerStatus === 'running'
            ? 'Synchronized from the room clock.'
            : 'Paused for everyone in the room.'}
      </p>

      {canControl ? (
        <form action={formAction} className="mt-7">
          <input name="roomId" type="hidden" value={roomId} />
          <input name="revision" type="hidden" value={timerRevision} />
          <div className="flex flex-wrap justify-center gap-2">
            <StudyRoomSubmitButton
              name="action"
              pendingLabel="Syncing…"
              value={timerStatus === 'running' ? 'pause' : 'start'}
            >
              {timerStatus === 'running' ? (
                <Pause aria-hidden className="h-4 w-4" />
              ) : (
                <Play aria-hidden className="h-4 w-4" />
              )}
              <span>{timerStatus === 'running' ? 'Pause' : 'Start'}</span>
            </StudyRoomSubmitButton>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-[#bfb39d] bg-[#fffdf6] px-4 text-sm font-bold transition hover:border-[#17453a] hover:bg-[#eef4ed]"
              name="action"
              type="submit"
              value="reset"
            >
              <RefreshCcw aria-hidden className="h-4 w-4" />
              Reset
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-[#bfb39d] bg-[#fffdf6] px-4 text-sm font-bold transition hover:border-[#17453a] hover:bg-[#eef4ed]"
              name="action"
              type="submit"
              value="skip"
            >
              <SkipForward aria-hidden className="h-4 w-4" />
              Next phase
            </button>
          </div>
          <div className="mt-3 flex justify-center">
            <StudyRoomActionStatus state={state} />
          </div>
        </form>
      ) : (
        <p className="mx-auto mt-7 max-w-md border-t border-[#d8cdb9] pt-5 text-xs leading-relaxed text-[#171512]/50">
          The host and co-hosts control the shared timer. Your countdown updates
          automatically.
        </p>
      )}
    </div>
  )
}
