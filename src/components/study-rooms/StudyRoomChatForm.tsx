'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { sendStudyRoomMessageAction } from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'
import { StudyRoomActionStatus } from './StudyRoomActionStatus'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

export function StudyRoomChatForm({ roomId }: { roomId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState(
    sendStudyRoomMessageAction,
    initialStudyRoomActionState,
  )

  useEffect(() => {
    if (state.kind === 'success') formRef.current?.reset()
  }, [state.kind])

  return (
    <form action={formAction} className="border-t border-club-line pt-4" ref={formRef}>
      <input name="roomId" type="hidden" value={roomId} />
      <label className="sr-only" htmlFor="study-room-message">
        Message the room
      </label>
      <textarea
        className="min-h-24 w-full resize-y rounded-xl border border-club-line bg-club-paper px-3.5 py-3 text-sm leading-relaxed outline-none transition focus:border-club-purple focus:ring-2 focus:ring-club-purple/15"
        id="study-room-message"
        maxLength={1000}
        name="body"
        placeholder="Share a question or checkpoint…"
        required
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <StudyRoomActionStatus state={state} />
        <StudyRoomSubmitButton pendingLabel="Sending…">
          <Send aria-hidden className="h-4 w-4" />
          Send
        </StudyRoomSubmitButton>
      </div>
    </form>
  )
}
