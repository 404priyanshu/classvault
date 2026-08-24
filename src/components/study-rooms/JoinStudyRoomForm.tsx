'use client'

import { useActionState } from 'react'
import { LogIn } from 'lucide-react'
import { joinStudyRoomAction } from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'
import { StudyRoomActionStatus } from './StudyRoomActionStatus'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

export function JoinStudyRoomForm({ roomId }: { roomId: string }) {
  const [state, formAction] = useActionState(
    joinStudyRoomAction,
    initialStudyRoomActionState,
  )

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input name="roomId" type="hidden" value={roomId} />
      <StudyRoomSubmitButton pendingLabel="Joining…">
        <LogIn aria-hidden className="h-4 w-4" />
        Join room
      </StudyRoomSubmitButton>
      <StudyRoomActionStatus state={state} />
    </form>
  )
}
