'use client'

import { useActionState, useEffect } from 'react'
import {
  removeStudyRoomMemberAction,
  setStudyRoomMuteAction,
} from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'
import { StudyRoomActionStatus } from './StudyRoomActionStatus'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

type ReasonVariant = 'mute' | 'unmute' | 'remove'

const copy: Record<
  ReasonVariant,
  { confirm: string; hint: string; pending: string; placeholder: string; title: string }
> = {
  mute: {
    confirm: 'Mute for this room',
    hint: 'They stay in the room and keep the timer; they cannot post in chat. The mute lasts as long as the room does.',
    pending: 'Muting…',
    placeholder: 'Why they are being muted',
    title: 'Mute',
  },
  remove: {
    confirm: 'Remove from room',
    hint: 'They leave the room and cannot rejoin it. Other rooms and their account are untouched.',
    pending: 'Removing…',
    placeholder: 'Why they are being removed',
    title: 'Remove',
  },
  unmute: {
    confirm: 'Lift the mute',
    hint: 'They can post in this room again. The original mute stays in the moderation record.',
    pending: 'Lifting…',
    placeholder: 'Why the mute is being lifted',
    title: 'Lift the mute on',
  },
}

/**
 * The reason-carrying half of the room controls: mute, unmute, and remove.
 *
 * All three take a reason because the database refuses without one, and all
 * three are room-scoped -- none of them touches the participant's account. The
 * hint under each says so, because "remove" reads like a ban and is not one.
 */
export function StudyRoomReasonForm({
  displayName,
  onSuccess,
  roomId,
  userId,
  variant,
}: {
  displayName: string
  onSuccess: () => void
  roomId: string
  userId: string
  variant: ReasonVariant
}) {
  const [state, formAction] = useActionState(
    variant === 'remove' ? removeStudyRoomMemberAction : setStudyRoomMuteAction,
    initialStudyRoomActionState,
  )
  const labels = copy[variant]
  const fieldId = `room-${variant}-${userId}`

  useEffect(() => {
    if (state.kind === 'success') onSuccess()
  }, [onSuccess, state])

  return (
    <form action={formAction} className="space-y-3">
      <input name="roomId" type="hidden" value={roomId} />
      <input name="userId" type="hidden" value={userId} />
      {variant === 'remove' ? null : (
        <input name="muted" type="hidden" value={variant === 'mute' ? 'true' : 'false'} />
      )}

      <div>
        <p className="text-sm font-bold">
          {labels.title} {displayName}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-club-muted">{labels.hint}</p>
      </div>

      <label className="sr-only" htmlFor={fieldId}>
        {labels.placeholder}
      </label>
      <input
        className="h-10 w-full rounded-xl border border-club-line bg-club-paper px-3 text-sm outline-none placeholder:text-club-muted focus:border-club-purple focus:ring-2 focus:ring-club-purple/15"
        id={fieldId}
        maxLength={500}
        name="reason"
        placeholder={labels.placeholder}
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StudyRoomActionStatus state={state} />
        <StudyRoomSubmitButton
          className={
            variant === 'remove'
              ? 'min-h-9 bg-[#9a3328] px-3 text-xs hover:bg-[#7c2820]'
              : 'min-h-9 px-3 text-xs'
          }
          pendingLabel={labels.pending}
        >
          {labels.confirm}
        </StudyRoomSubmitButton>
      </div>
    </form>
  )
}
