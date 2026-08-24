import type { SettingsActionState } from '@/lib/settings/action-state'

export function SettingsFormStatus({ state }: { state: SettingsActionState }) {
  if (!state.message) return null

  return (
    <p
      aria-live="polite"
      className={`text-sm font-semibold ${
        state.kind === 'error' ? 'text-[#9a3328]' : 'text-[#246447]'
      }`}
    >
      {state.message}
    </p>
  )
}
