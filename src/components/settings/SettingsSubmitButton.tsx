'use client'

import { Check, LoaderCircle } from 'lucide-react'
import { useFormStatus } from 'react-dom'

export function SettingsSubmitButton({
  idleLabel = 'Save changes',
  pendingLabel = 'Saving…',
}: {
  idleLabel?: string
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-club-purple px-4 text-sm font-bold text-club-paper transition duration-200 hover:bg-club-deep active:translate-y-px disabled:cursor-wait disabled:opacity-60"
      data-cuelume-press
      data-cuelume-release
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        <Check aria-hidden className="h-4 w-4" />
      )}
      {pending ? pendingLabel : idleLabel}
    </button>
  )
}
