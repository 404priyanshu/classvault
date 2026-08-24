'use client'

import { useActionState } from 'react'
import { updateStudyPreferencesAction } from '@/app/dashboard/settings/actions'
import { initialSettingsActionState } from '@/lib/settings/action-state'
import { SettingsFormStatus } from './SettingsFormStatus'
import { SettingsSubmitButton } from './SettingsSubmitButton'

const goals = [
  ['ace_exams', 'Ace my exams'],
  ['stay_consistent', 'Stay consistent'],
  ['master_subjects', 'Master difficult subjects'],
  ['placement_prep', 'Prepare for placements'],
] as const

const studyStyles = [
  ['solo', 'Mostly solo'],
  ['accountability', 'Accountability'],
  ['study_group', 'Study groups'],
] as const

export function StudyPreferencesForm({
  primaryGoal,
  studyPreference,
}: {
  primaryGoal: string
  studyPreference: string
}) {
  const [state, formAction] = useActionState(
    updateStudyPreferencesAction,
    initialSettingsActionState,
  )

  return (
    <form action={formAction}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="text-sm font-bold">Primary goal</span>
          <span className="mt-1 block text-xs text-[#171512]/50">
            Used to tune roadmap and dashboard suggestions.
          </span>
          <select
            className="mt-2 min-h-11 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3.5 text-sm font-semibold outline-none transition focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
            defaultValue={primaryGoal}
            name="primaryGoal"
          >
            {goals.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-bold">Preferred study style</span>
          <span className="mt-1 block text-xs text-[#171512]/50">
            Controls which study-room and planning prompts appear first.
          </span>
          <select
            className="mt-2 min-h-11 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3.5 text-sm font-semibold outline-none transition focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
            defaultValue={studyPreference}
            name="studyPreference"
          >
            {studyStyles.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dacb] pt-5">
        <SettingsFormStatus state={state} />
        <SettingsSubmitButton idleLabel="Save preferences" />
      </div>
    </form>
  )
}
