'use client'

import { useActionState } from 'react'
import { Plus } from 'lucide-react'
import { createStudyRoomAction } from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'
import { StudyRoomActionStatus } from './StudyRoomActionStatus'
import { StudyRoomSubmitButton } from './StudyRoomSubmitButton'

const fieldClass =
  'mt-2 min-h-11 w-full rounded-xl border border-club-line bg-club-paper px-3.5 text-sm font-semibold outline-none transition focus:border-club-purple focus:ring-2 focus:ring-club-purple/15'

export function CreateStudyRoomForm({
  universityName,
  universityVerified,
}: {
  universityName: string | null
  universityVerified: boolean
}) {
  const [state, formAction] = useActionState(
    createStudyRoomAction,
    initialStudyRoomActionState,
  )

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="text-sm font-bold">Room name</span>
        <input
          className={fieldClass}
          maxLength={80}
          minLength={3}
          name="name"
          placeholder="Operating Systems sprint"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold">Subject</span>
        <input
          className={fieldClass}
          maxLength={60}
          minLength={2}
          name="subjectTag"
          placeholder="Operating Systems"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold">Access</span>
        <select className={fieldClass} defaultValue="public" name="visibility">
          <option value="public">Public — all eligible students</option>
          <option disabled={!universityVerified} value="university">
            {universityVerified && universityName
              ? `${universityName} only`
              : 'Verified university only'}
          </option>
        </select>
        {!universityVerified ? (
          <span className="mt-2 block text-xs leading-relaxed text-club-muted">
            Campus rooms unlock after university verification.
          </span>
        ) : null}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="text-sm font-bold">Focus</span>
          <select className={fieldClass} defaultValue="25" name="focusMinutes">
            {[15, 20, 25, 30, 45, 60].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-bold">Break</span>
          <select className={fieldClass} defaultValue="5" name="breakMinutes">
            {[5, 10, 15, 20].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3 border-t border-club-line pt-5">
        <StudyRoomActionStatus state={state} />
        <StudyRoomSubmitButton className="w-full" pendingLabel="Creating room…">
          <Plus aria-hidden className="h-4 w-4" />
          Create study room
        </StudyRoomSubmitButton>
        <p className="text-center text-[11px] leading-relaxed text-club-muted">
          Free rooms hold up to 8 members and expire after 2 hours.
        </p>
      </div>
    </form>
  )
}
