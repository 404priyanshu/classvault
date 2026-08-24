import type { StudyRoomActionState } from '@/lib/study-rooms/action-state'

export function StudyRoomActionStatus({
  state,
}: {
  state: StudyRoomActionState
}) {
  if (!state.message) return null

  return (
    <p
      aria-live="polite"
      className={`text-xs font-semibold ${
        state.kind === 'error' ? 'text-[#9a3328]' : 'text-[#246447]'
      }`}
    >
      {state.message}
    </p>
  )
}
