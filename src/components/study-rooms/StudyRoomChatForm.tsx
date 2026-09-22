'use client'

import { useActionState, useEffect, useRef } from 'react'
import { MicOff, Send } from 'lucide-react'
import { sendStudyRoomMessageAction } from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'
import { StudyRoomActionStatus } from './StudyRoomActionStatus'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

export function StudyRoomChatForm({
  muted,
  roomId,
}: {
  muted: boolean
  roomId: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState(
    sendStudyRoomMessageAction,
    initialStudyRoomActionState,
  )

  useEffect(() => {
    if (state.kind === 'success') formRef.current?.reset()
  }, [state.kind])

  // The database refuses the post either way; this only stops a muted student
  // writing a paragraph before finding that out.
  if (muted) {
    return (
      <p
        className="flex items-start gap-2 border-t border-club-line pt-4 text-xs leading-relaxed text-club-muted"
        role="status"
      >
        <MicOff aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#9a3328]" />
        <span>
          A host muted you in this room, so you cannot post here. You can still
          read the chat and use the timer, and the mute ends with the room.
        </span>
      </p>
    )
  }

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
