'use client'

import { LogOut, Trash2 } from 'lucide-react'
import {
  endStudyRoomAction,
  leaveStudyRoomAction,
} from '@/app/dashboard/study-rooms/actions'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

export function StudyRoomExitControls({
  isHost,
  roomId,
}: {
  isHost: boolean
  roomId: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form
        action={leaveStudyRoomAction}
        onSubmit={(event) => {
          if (!window.confirm('Leave this study room now?')) event.preventDefault()
        }}
      >
        <input name="roomId" type="hidden" value={roomId} />
        <StudyRoomSubmitButton
          className="border border-[#bfb39d] bg-[#fffdf6] text-[#171512] hover:bg-[#eee6d8]"
          pendingLabel="Leaving…"
        >
          <LogOut aria-hidden className="h-4 w-4" />
          Leave room
        </StudyRoomSubmitButton>
      </form>

      {isHost ? (
        <form
          action={endStudyRoomAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                'End this room for everyone? The room and temporary chat will be deleted.',
              )
            ) {
              event.preventDefault()
            }
          }}
        >
          <input name="roomId" type="hidden" value={roomId} />
          <StudyRoomSubmitButton
            className="bg-[#9a3328] hover:bg-[#7c281f]"
            pendingLabel="Ending…"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            End for everyone
          </StudyRoomSubmitButton>
        </form>
      ) : null}
    </div>
  )
}
