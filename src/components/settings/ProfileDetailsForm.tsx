'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileSettingsAction } from '@/app/dashboard/settings/actions'
import { initialSettingsActionState } from '@/lib/settings/action-state'
import { SettingsFormStatus } from './SettingsFormStatus'
import { SettingsSubmitButton } from './SettingsSubmitButton'

export function ProfileDetailsForm({
  course,
  displayName,
  graduationYear,
}: {
  course: string
  displayName: string
  graduationYear: number
}) {
  const router = useRouter()
  const [state, formAction] = useActionState(
    updateProfileSettingsAction,
    initialSettingsActionState,
  )

  useEffect(() => {
    if (state.kind === 'success') router.refresh()
  }, [router, state.kind])

  return (
    <form action={formAction}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-bold">Display name</span>
          <span className="mt-1 block text-xs text-[#171512]/50">
            This pseudonymous name appears beside notes you share.
          </span>
          <input
            autoComplete="name"
            className="mt-2 min-h-11 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3.5 text-sm font-semibold outline-none transition focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
            defaultValue={displayName}
            maxLength={80}
            minLength={2}
            name="displayName"
            required
          />
        </label>

        <label>
          <span className="text-sm font-bold">Degree</span>
          <select
            className="mt-2 min-h-11 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3.5 text-sm font-semibold outline-none transition focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
            defaultValue={course}
            name="course"
            required
          >
            {['MCA', 'BCA', 'B.Tech', 'M.Tech'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-bold">Graduation year</span>
          <input
            className="mt-2 min-h-11 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3.5 text-sm font-semibold outline-none transition focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
            defaultValue={graduationYear}
            inputMode="numeric"
            max={2100}
            min={2000}
            name="graduationYear"
            required
            type="number"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dacb] pt-5">
        <SettingsFormStatus state={state} />
        <SettingsSubmitButton />
      </div>
    </form>
  )
}
