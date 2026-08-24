'use client'

import { useActionState } from 'react'
import { updateSettingsPasswordAction } from '@/app/dashboard/settings/actions'
import { initialSettingsActionState } from '@/lib/settings/action-state'
import { SettingsFormStatus } from './SettingsFormStatus'
import { SettingsSubmitButton } from './SettingsSubmitButton'

export function PasswordSettingsForm() {
  const [state, formAction] = useActionState(
    updateSettingsPasswordAction,
    initialSettingsActionState,
  )

  return (
    <form action={formAction}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="text-sm font-bold">New password</span>
          <input
            autoComplete="new-password"
            className="mt-2 min-h-11 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3.5 text-sm font-semibold outline-none transition focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
            maxLength={72}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <label>
          <span className="text-sm font-bold">Confirm new password</span>
          <input
            autoComplete="new-password"
            className="mt-2 min-h-11 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] px-3.5 text-sm font-semibold outline-none transition focus:border-[#17453a] focus:ring-2 focus:ring-[#17453a]/15"
            maxLength={72}
            minLength={8}
            name="passwordConfirmation"
            required
            type="password"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dacb] pt-5">
        <SettingsFormStatus state={state} />
        <SettingsSubmitButton idleLabel="Update password" />
      </div>
    </form>
  )
}
